'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Prisma } from '@/prisma/generated/client';
import { getBudgetStatus } from './categories';
import { ensureDbUser } from '@/lib/ensure-user';
import { parseDateOnly } from '@/app/utils/dates';

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  Alimentação: '#ef4444',
  Transporte: '#3b82f6',
  Lazer: '#8b5cf6',
  Casa: '#f59e0b',
  Saúde: '#10b981',
  Geral: '#71717a',
};

export async function createTransaction(data: any, referenceMounth: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');

  try {
    await ensureDbUser(user);

    const category = await prisma.category.upsert({
      where: { name_userId: { name: data.category, userId: user.id } },
      update: {},
      create: {
        name: data.category,
        type: data.type,
        userId: user.id,
        color: DEFAULT_CATEGORY_COLORS[data.category] || '#71717a',
      },
    });

    const safeReferenceMounth =
      referenceMounth || new Date().toISOString().slice(0, 7);

    const [year, mounth] = safeReferenceMounth.split('-').map(Number);
    const referenceDate = new Date(year, mounth - 1, 1, 12, 0, 0);

    await prisma.transaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        date: parseDateOnly(data.date),
        referenceDate: referenceDate, // Campo de competência
        type: data.type,
        userId: user.id,
        categoryId: category.id,
      },
    });

    revalidatePath('/Dashboard');
    revalidatePath('/Transactions');
    revalidatePath('/Categories');

    // Alerta de orçamento (não deve impedir o lançamento se falhar)
    let budgetAlert: Awaited<ReturnType<typeof getBudgetStatus>> = null;
    if (data.type === 'expense') {
      try {
        const status = await getBudgetStatus(
          data.category,
          safeReferenceMounth,
        );
        if (status && status.percent >= 80) budgetAlert = status;
      } catch (e) {
        console.error('Erro ao calcular orçamento:', e);
      }
    }

    return { success: true, budgetAlert };
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return { success: false };
  }
}

export async function getTransactions(limit?: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: limit,
      // OTIMIZAÇÃO 1: Selecione apenas os campos usados na tela
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        referenceDate: true,
        type: true,
        category: {
          select: {
            name: true,
            color: true,
          },
        },
      },
    });

    // OTIMIZAÇÃO 2: Conversão mais limpa
    return transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      referenceDate: t.referenceDate.toISOString(),
    }));
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }
}

/**
 * Totais por mês de competência, tipo e categoria para o Dashboard.
 * Soma no banco em vez de enviar todas as transações para o navegador;
 * cada linha tem o mesmo formato de uma transação (referenceDate, type, amount, category).
 */
export async function getDashboardTotals() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const [groups, categories] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['referenceDate', 'type', 'categoryId'],
        where: { userId: user.id },
        _sum: { amount: true },
      }),
      prisma.category.findMany({
        where: { userId: user.id },
        select: { id: true, name: true, color: true },
      }),
    ]);

    const categoryById = new Map(categories.map((c) => [c.id, c]));

    return groups.map((g) => {
      const category = g.categoryId ? categoryById.get(g.categoryId) : null;
      return {
        referenceDate: g.referenceDate.toISOString(),
        type: g.type,
        amount: Number(g._sum.amount ?? 0),
        category: category ? { name: category.name, color: category.color } : null,
      };
    });
  } catch (error) {
    console.error('Erro ao buscar totais do dashboard:', error);
    return [];
  }
}

export type TransactionFilters = {
  q?: string;
  category?: string;
  month?: string; // YYYY-MM (mês de competência)
  type?: 'income' | 'expense';
  status?: 'paid' | 'pending';
  minAmount?: number;
  maxAmount?: number;
  sort?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
  page?: number;
  pageSize?: number;
};

export type TransactionItem = {
  id: string;
  description: string;
  amount: number;
  date: string;
  referenceDate: string;
  type: string;
  isPaid: boolean;
  recurringRuleId: string | null;
  category: { name: string; color: string } | null;
};

const SORT_MAP: Record<
  NonNullable<TransactionFilters['sort']>,
  Prisma.TransactionOrderByWithRelationInput[]
> = {
  date_desc: [{ date: 'desc' }, { id: 'desc' }],
  date_asc: [{ date: 'asc' }, { id: 'asc' }],
  amount_desc: [{ amount: 'desc' }, { id: 'desc' }],
  amount_asc: [{ amount: 'asc' }, { id: 'asc' }],
};

/**
 * Busca paginada com filtros aplicados no banco.
 * Retorna também os totais (receita/despesa) do conjunto filtrado e as
 * opções disponíveis para os selects de categoria e mês.
 */
export async function getTransactionsPage(filters: TransactionFilters = {}) {
  const empty = {
    items: [] as TransactionItem[],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    totals: { income: 0, expense: 0 },
    categories: [] as string[],
    months: [] as string[],
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  try {
    const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
    const requestedPage = Math.max(Math.floor(filters.page ?? 1), 1);

    const where: Prisma.TransactionWhereInput = { userId: user.id };

    if (filters.q?.trim()) {
      where.description = { contains: filters.q.trim(), mode: 'insensitive' };
    }

    if (filters.category) {
      where.category = { name: filters.category };
    }

    if (filters.type === 'income' || filters.type === 'expense') {
      where.type = filters.type;
    }

    if (filters.status === 'paid') where.isPaid = true;
    if (filters.status === 'pending') where.isPaid = false;

    if (filters.month && /^\d{4}-\d{2}$/.test(filters.month)) {
      const [year, month] = filters.month.split('-').map(Number);
      where.referenceDate = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }

    const amountFilter: Prisma.DecimalFilter = {};
    if (typeof filters.minAmount === 'number' && !isNaN(filters.minAmount)) {
      amountFilter.gte = filters.minAmount;
    }
    if (typeof filters.maxAmount === 'number' && !isNaN(filters.maxAmount)) {
      amountFilter.lte = filters.maxAmount;
    }
    if (Object.keys(amountFilter).length) where.amount = amountFilter;

    const orderBy = SORT_MAP[filters.sort ?? 'date_desc'] ?? SORT_MAP.date_desc;

    const [total, totalsByType, categories, months] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true },
      }),
      prisma.category.findMany({
        where: { userId: user.id },
        select: { name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.transaction.findMany({
        where: { userId: user.id },
        select: { referenceDate: true },
        distinct: ['referenceDate'],
        orderBy: { referenceDate: 'desc' },
      }),
    ]);

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const page = Math.min(requestedPage, totalPages);

    const rows = await prisma.transaction.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        referenceDate: true,
        type: true,
        isPaid: true,
        recurringRuleId: true,
        category: { select: { name: true, color: true } },
      },
    });

    const sumOf = (type: string) =>
      Number(totalsByType.find((t) => t.type === type)?._sum.amount ?? 0);

    return {
      items: rows.map((t) => ({
        ...t,
        amount: Number(t.amount),
        date: t.date.toISOString(),
        referenceDate: t.referenceDate.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages,
      totals: { income: sumOf('income'), expense: sumOf('expense') },
      categories: categories.map((c) => c.name),
      months: Array.from(
        new Set(
          months.map(
            (m) =>
              `${m.referenceDate.getFullYear()}-${String(m.referenceDate.getMonth() + 1).padStart(2, '0')}`,
          ),
        ),
      ),
    };
  } catch (error) {
    console.error('Erro ao buscar transações paginadas:', error);
    return empty;
  }
}

export async function setTransactionPaid(id: string, isPaid: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');
  try {
    // updateMany garante que só altera transações do próprio usuário
    const result = await prisma.transaction.updateMany({
      where: { id, userId: user.id },
      data: { isPaid },
    });
    if (result.count === 0) return { success: false };
    revalidatePath('/Transactions');
    revalidatePath('/Recurring');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar status de pagamento:', error);
    return { success: false };
  }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');
  try {
    await prisma.transaction.delete({ where: { id, userId: user.id } });
    revalidatePath('/Dashboard');
    revalidatePath('/Transactions');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function updateTransaction(
  id: string,
  data: any,
  referenceMounth: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');

  try {
    const category = await prisma.category.upsert({
      where: { name_userId: { name: data.category, userId: user.id } },
      update: {},
      create: {
        name: data.category,
        type: data.type,
        userId: user.id,
        color: '#71717a',
      },
    });

    const [year, mounth] = referenceMounth.split('-').map(Number);
    const referenceDate = new Date(year, mounth - 1, 1, 12, 0, 0);

    await prisma.transaction.update({
      where: { id, userId: user.id },
      data: {
        description: data.description,
        amount: data.amount,
        date: parseDateOnly(data.date),
        referenceDate: referenceDate,
        type: data.type,
        categoryId: category.id,
      },
    });

    revalidatePath('/Transactions');
    revalidatePath('/Dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    return { success: false };
  }
}
