'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  Alimentação: '#ef4444',
  Transporte: '#3b82f6',
  Lazer: '#8b5cf6',
  Casa: '#f59e0b',
  Saúde: '#10b981',
  Geral: '#71717a',
};

export async function createTransaction(data: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');

  try {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email! },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || 'Usuário',
      },
    });

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

    // Lógica de Referência: Para transações manuais, usamos o 1º dia do mês da transação
    const tDate = new Date(data.date);
    const referenceDate = new Date(
      tDate.getFullYear(),
      tDate.getMonth(),
      1,
      12,
      0,
      0,
    );

    await prisma.transaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        date: tDate,
        referenceDate: referenceDate, // Campo de competência
        type: data.type,
        userId: user.id,
        categoryId: category.id,
      },
    });

    revalidatePath('/Dashboard');
    revalidatePath('/Transactions');
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return { success: false };
  }
}

export async function getTransactions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
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

export async function getAllTransactions(query?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        ...(query
          ? { description: { contains: query, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { date: 'desc' },
      include: { category: true },
    });

    return transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      referenceDate: t.referenceDate.toISOString(),
    }));
  } catch (error) {
    return [];
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

export async function updateTransaction(id: string, data: any) {
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

    const tDate = new Date(data.date);
    const referenceDate = new Date(
      tDate.getFullYear(),
      tDate.getMonth(),
      1,
      12,
      0,
      0,
    );

    await prisma.transaction.update({
      where: { id, userId: user.id },
      data: {
        description: data.description,
        amount: data.amount,
        date: tDate,
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
