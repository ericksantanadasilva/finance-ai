'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * BUSCAR TODAS AS METAS DO USUÁRIO
 */
export async function getGoals() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return await prisma.goal.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      deadline: 'asc',
    },
  });
}

/**
 * CRIAR NOVA META
 */
export async function createGoal(data: {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Não autorizado');

  // TRATAMENTO DE DATA: Tenta converter, se falhar, fica nulo
  let parsedDeadline: Date | null = null;
  if (data.deadline) {
    const d = new Date(data.deadline);
    if (!isNaN(d.getTime())) {
      parsedDeadline = d;
    }
  }

  const result = await prisma.goal.create({
    data: {
      name: data.name,
      targetAmount: Number(data.targetAmount),
      currentAmount: Number(data.currentAmount),
      deadline: parsedDeadline,
      userId: user.id,
    },
  });

  revalidatePath('/Goals');
  return { success: true };
}

/**
 * ATUALIZAR VALOR ATUAL DA META (Adicionar fundos)
 */
export async function updateGoalAmount(id: string, amountToAdd: number) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Não autorizado');

    const value = Number(amountToAdd);
    if (isNaN(value)) throw new Error('Valor inválido');

    // Usamos o 'increment' do Prisma para somar ao valor atual no banco
    await prisma.goal.update({
      where: {
        id: id,
        userId: user.id,
      },
      data: {
        currentAmount: {
          increment: value,
        },
      },
    });

    revalidatePath('/Goals');
    revalidatePath('/Dashboard');

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    return { success: false };
  }
}

/**
 * DELETAR META
 */
export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Não autorizado');

  await prisma.goal.delete({
    where: {
      id,
      userId: user.id,
    },
  });

  revalidatePath('/Goals');
  return { success: true };
}
