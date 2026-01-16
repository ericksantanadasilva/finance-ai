'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// Cores reais para salvar no banco em vez de classes CSS
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
    // 1. Garantir que o usuário exista na tabela User do Prisma (Sincronização)
    await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email! },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || 'Usuário',
      },
    });

    // 2. Upsert da Categoria com a COR CORRETA (Hexadecimal)
    const category = await prisma.category.upsert({
      where: { name_userId: { name: data.category, userId: user.id } },
      update: {},
      create: {
        name: data.category,
        type: data.type,
        userId: user.id,
        color: DEFAULT_CATEGORY_COLORS[data.category] || '#71717a', // Salva o HEX
      },
    });

    // 3. Criar a transação
    await prisma.transaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        type: data.type,
        userId: user.id,
        categoryId: category.id,
      },
    });

    revalidatePath('/Dashboard');
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
      include: { category: true },
    });

    return transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: t.date.toISOString(),
    }));
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }
}

// Adicione esta função ao seu arquivo de actions existente
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
          ? {
              description: { contains: query, mode: 'insensitive' },
            }
          : {}),
      },
      orderBy: { date: 'desc' },
      include: { category: true },
    });

    return transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: t.date.toISOString(),
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
    await prisma.transaction.delete({
      where: { id, userId: user.id },
    });
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
    // 1. Garantir categoria (mesma lógica do create)
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

    // 2. Atualizar a transação
    await prisma.transaction.update({
      where: { id, userId: user.id },
      data: {
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
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
