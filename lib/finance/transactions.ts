// Regras de transações por usuário, usadas pelas server actions e pelas rotas da API.
// Sem 'use server': o userId vem de quem chama, depois de autenticar.
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/prisma/generated/client';
import {
  APP_TIME_ZONE,
  currentMonthISO,
  parseDateOnly,
} from '@/app/utils/dates';
import { getBudgetStatus, type BudgetStatus } from './categories';

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  Alimentação: '#ef4444',
  Transporte: '#3b82f6',
  Lazer: '#8b5cf6',
  Casa: '#f59e0b',
  Saúde: '#10b981',
  Geral: '#71717a',
};

export type TransactionInput = {
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD (aceita sufixo de hora, ver parseDateOnly)
  type: 'income' | 'expense';
  category: string; // nome; é criada se ainda não existir
};

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

// Campos de TransactionItem: usados na listagem e na resposta das rotas de escrita
const TRANSACTION_ITEM_SELECT = {
  id: true,
  description: true,
  amount: true,
  date: true,
  referenceDate: true,
  type: true,
  isPaid: true,
  recurringRuleId: true,
  category: { select: { name: true, color: true } },
} satisfies Prisma.TransactionSelect;

function toTransactionItem(
  t: Prisma.TransactionGetPayload<{ select: typeof TRANSACTION_ITEM_SELECT }>,
): TransactionItem {
  return {
    ...t,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    referenceDate: t.referenceDate.toISOString(),
  };
}

const SORT_MAP: Record<
  NonNullable<TransactionFilters['sort']>,
  Prisma.TransactionOrderByWithRelationInput[]
> = {
  date_desc: [{ date: 'desc' }, { id: 'desc' }],
  date_asc: [{ date: 'asc' }, { id: 'asc' }],
  amount_desc: [{ amount: 'desc' }, { id: 'desc' }],
  amount_asc: [{ amount: 'asc' }, { id: 'asc' }],
};

/** Data de competência: dia 1 do mês "YYYY-MM", ao meio-dia. */
function referenceDateOf(month: string) {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, 1, 12, 0, 0);
}

/**
 * Cria a transação (e a categoria, se for nova) e devolve o TransactionItem.
 * Para despesas, devolve também o orçamento da categoria quando passou de 80%.
 */
export async function createTransaction(
  userId: string,
  data: TransactionInput,
  referenceMonth?: string,
) {
  const category = await prisma.category.upsert({
    where: { name_userId: { name: data.category, userId } },
    update: {},
    create: {
      name: data.category,
      type: data.type,
      userId,
      color: DEFAULT_CATEGORY_COLORS[data.category] || '#71717a',
    },
  });

  const safeReferenceMonth = referenceMonth || currentMonthISO(APP_TIME_ZONE);

  const transaction = await prisma.transaction.create({
    data: {
      description: data.description,
      amount: data.amount,
      date: parseDateOnly(data.date),
      referenceDate: referenceDateOf(safeReferenceMonth), // Campo de competência
      type: data.type,
      userId,
      categoryId: category.id,
    },
    select: TRANSACTION_ITEM_SELECT,
  });

  // Alerta de orçamento (não deve impedir o lançamento se falhar)
  let budgetAlert: BudgetStatus | null = null;
  if (data.type === 'expense') {
    try {
      const status = await getBudgetStatus(
        userId,
        data.category,
        safeReferenceMonth,
      );
      if (status && status.percent >= 80) budgetAlert = status;
    } catch (e) {
      console.error('Erro ao calcular orçamento:', e);
    }
  }

  return {
    id: transaction.id,
    transaction: toTransactionItem(transaction),
    budgetAlert,
  };
}

export async function getRecentTransactions(userId: string, limit?: number) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: limit,
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

  return transactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    referenceDate: t.referenceDate.toISOString(),
  }));
}

/**
 * Totais por mês de competência, tipo e categoria para o Dashboard.
 * Soma no banco em vez de enviar todas as transações para o navegador;
 * cada linha tem o mesmo formato de uma transação (referenceDate, type, amount, category).
 */
export async function getDashboardTotals(userId: string) {
  const [groups, categories] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['referenceDate', 'type', 'categoryId'],
      where: { userId },
      _sum: { amount: true },
    }),
    prisma.category.findMany({
      where: { userId },
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
}

/**
 * Busca paginada com filtros aplicados no banco.
 * Retorna também os totais (receita/despesa) do conjunto filtrado e as
 * opções disponíveis para os selects de categoria e mês.
 */
export async function getTransactionsPage(
  userId: string,
  filters: TransactionFilters = {},
) {
  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
  const requestedPage = Math.max(Math.floor(filters.page ?? 1), 1);

  const where: Prisma.TransactionWhereInput = { userId };

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

  let monthStart: Date | null = null;
  if (filters.month && /^\d{4}-\d{2}$/.test(filters.month)) {
    const [year, month] = filters.month.split('-').map(Number);
    monthStart = new Date(year, month - 1, 1);
    where.referenceDate = {
      gte: monthStart,
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

  // Sobra dos meses anteriores: só faz sentido vendo o mês inteiro, sem outros filtros
  const carryOverStart =
    Object.keys(where).length === 2 && monthStart ? monthStart : null;

  const [total, totalsByType, categories, months, previous] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
    }),
    prisma.category.findMany({
      where: { userId },
      select: { name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.transaction.findMany({
      where: { userId },
      select: { referenceDate: true },
      distinct: ['referenceDate'],
      orderBy: { referenceDate: 'desc' },
    }),
    carryOverStart
      ? prisma.transaction.groupBy({
          by: ['type'],
          where: { userId, referenceDate: { lt: carryOverStart } },
          _sum: { amount: true },
        })
      : [],
  ]);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const page = Math.min(requestedPage, totalPages);

  const rows = await prisma.transaction.findMany({
    where,
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: TRANSACTION_ITEM_SELECT,
  });

  const sumOf = (type: string) =>
    Number(totalsByType.find((t) => t.type === type)?._sum.amount ?? 0);

  const carryOver = previous.reduce(
    (acc, p) =>
      acc + (p.type === 'income' ? 1 : -1) * Number(p._sum.amount ?? 0),
    0,
  );

  return {
    items: rows.map(toTransactionItem),
    total,
    page,
    pageSize,
    totalPages,
    totals: { income: sumOf('income'), expense: sumOf('expense'), carryOver },
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
}

/** TransactionItem por id, ou null se não existir ou for de outro usuário. */
export async function getTransactionItem(userId: string, id: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    select: TRANSACTION_ITEM_SELECT,
  });
  return transaction ? toTransactionItem(transaction) : null;
}

/** Retorna false se a transação não existir ou for de outro usuário. */
export async function setTransactionPaid(
  userId: string,
  id: string,
  isPaid: boolean,
) {
  // updateMany garante que só altera transações do próprio usuário
  const result = await prisma.transaction.updateMany({
    where: { id, userId },
    data: { isPaid },
  });
  return result.count > 0;
}

/** Lança erro (P2025) se a transação não existir ou for de outro usuário. */
export async function deleteTransaction(userId: string, id: string) {
  await prisma.transaction.delete({ where: { id, userId } });
}

/** Devolve o TransactionItem alterado. Lança erro (P2025) se a transação não for do usuário. */
export async function updateTransaction(
  userId: string,
  id: string,
  data: TransactionInput,
  referenceMonth: string,
) {
  const category = await prisma.category.upsert({
    where: { name_userId: { name: data.category, userId } },
    update: {},
    create: {
      name: data.category,
      type: data.type,
      userId,
      color: '#71717a',
    },
  });

  const transaction = await prisma.transaction.update({
    where: { id, userId },
    data: {
      description: data.description,
      amount: data.amount,
      date: parseDateOnly(data.date),
      referenceDate: referenceDateOf(referenceMonth),
      type: data.type,
      categoryId: category.id,
    },
    select: TRANSACTION_ITEM_SELECT,
  });
  return toTransactionItem(transaction);
}
