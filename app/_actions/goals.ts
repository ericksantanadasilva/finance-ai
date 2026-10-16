'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSessionUser, requireUser } from '@/lib/auth';
import { ensureDbUser } from '@/lib/ensure-user';
import { parseDateOnly } from '@/app/utils/dates';

/**
 * BUSCAR TODAS AS METAS DO USUÁRIO
 */
export async function getGoals() {
  const user = await getSessionUser();

  if (!user) return [];

  return await prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: { deadline: 'asc' },
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
  const user = await requireUser();
  await ensureDbUser(user);

  let parsedDeadline: Date | null = null;
  if (data.deadline) {
    const d = parseDateOnly(data.deadline);
    if (!isNaN(d.getTime())) {
      parsedDeadline = d;
    }
  }

  await prisma.goal.create({
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
 * ATUALIZAR META COMPLETA (Edição de Nome, Valores e Prazo)
 */
export async function updateGoal(
  id: string,
  data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: string;
  },
) {
  try {
    const user = await requireUser();

    let parsedDeadline: Date | null = null;
    if (data.deadline) {
      const d = parseDateOnly(data.deadline);
      if (!isNaN(d.getTime())) {
        parsedDeadline = d;
      }
    }

    await prisma.goal.update({
      where: {
        id: id,
        userId: user.id,
      },
      data: {
        name: data.name,
        targetAmount: Number(data.targetAmount),
        currentAmount: Number(data.currentAmount), // Aqui ele substitui o valor, ideal para correções
        deadline: parsedDeadline,
      },
    });

    revalidatePath('/Goals');
    revalidatePath('/Dashboard');

    return { success: true };
  } catch (error) {
    console.error('Erro ao editar meta:', error);
    return { success: false };
  }
}

/**
 * ATUALIZAR APENAS O VALOR ATUAL (Aporte rápido)
 */
export async function updateGoalAmount(id: string, amountToAdd: number) {
  try {
    const user = await requireUser();

    const value = Number(amountToAdd);
    if (isNaN(value)) throw new Error('Valor inválido');

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
    console.error('Erro ao atualizar valor da meta:', error);
    return { success: false };
  }
}

/**
 * DELETAR META
 */
export async function deleteGoal(id: string) {
  const user = await requireUser();

  await prisma.goal.delete({
    where: {
      id,
      userId: user.id,
    },
  });

  revalidatePath('/Goals');
  return { success: true };
}
