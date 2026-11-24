'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser, requireUser } from '@/lib/auth';
import * as goalsService from '@/lib/finance/goals';
import type { GoalInput } from '@/lib/finance/goals';

/**
 * BUSCAR TODAS AS METAS DO USUÁRIO
 */
export async function getGoals() {
  const user = await getSessionUser();

  if (!user) return [];

  return goalsService.getGoals(user.id);
}

/**
 * CRIAR NOVA META
 */
export async function createGoal(data: GoalInput) {
  const user = await requireUser();

  await goalsService.createGoal(user.id, data);

  revalidatePath('/Goals');
  return { success: true };
}

/**
 * ATUALIZAR META COMPLETA (Edição de Nome, Valores e Prazo)
 */
export async function updateGoal(id: string, data: GoalInput) {
  try {
    const user = await requireUser();

    await goalsService.updateGoal(user.id, id, data);

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

    await goalsService.addToGoal(user.id, id, amountToAdd);

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

  await goalsService.deleteGoal(user.id, id);

  revalidatePath('/Goals');
  return { success: true };
}
