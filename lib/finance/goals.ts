// Metas por usuário, usadas pelas server actions e pelas rotas da API.
// Sem 'use server': o userId vem de quem chama, depois de autenticar.
import { prisma } from '@/lib/prisma';
import type { Goal } from '@/prisma/generated/client';
import { parseDateOnly } from '@/app/utils/dates';

export type GoalInput = {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // YYYY-MM-DD
};

/** Meta no formato da API: valores em número, prazo "YYYY-MM-DD" (ou null) e createdAt em ISO. */
export type GoalItem = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  createdAt: string; // início do ritmo da meta no app
};

export function toGoalItem(goal: Goal): GoalItem {
  return {
    id: goal.id,
    name: goal.name,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    // Prazos são gravados ao meio-dia UTC (parseDateOnly): a data UTC é o dia certo
    deadline: goal.deadline ? goal.deadline.toISOString().slice(0, 10) : null,
    createdAt: goal.createdAt.toISOString(),
  };
}

function parseDeadline(deadline?: string) {
  if (!deadline) return null;
  const d = parseDateOnly(deadline);
  return isNaN(d.getTime()) ? null : d;
}

/** Metas do usuário como vêm do Prisma (valores em Decimal). */
export async function getGoals(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: { deadline: 'asc' },
  });
}

export async function createGoal(userId: string, data: GoalInput) {
  const goal = await prisma.goal.create({
    data: {
      name: data.name,
      targetAmount: Number(data.targetAmount),
      currentAmount: Number(data.currentAmount),
      deadline: parseDeadline(data.deadline),
      userId,
    },
  });
  return toGoalItem(goal);
}

/** Edição completa: substitui nome, valores e prazo. Lança erro (P2025) se a meta não for do usuário. */
export async function updateGoal(userId: string, id: string, data: GoalInput) {
  await prisma.goal.update({
    where: { id, userId },
    data: {
      name: data.name,
      targetAmount: Number(data.targetAmount),
      currentAmount: Number(data.currentAmount),
      deadline: parseDeadline(data.deadline),
    },
  });
}

/**
 * Aporte: soma o valor ao atual e devolve a meta atualizada.
 * Lança erro se o valor for inválido ou a meta não for do usuário (P2025).
 */
export async function addToGoal(userId: string, id: string, amountToAdd: number) {
  const value = Number(amountToAdd);
  if (isNaN(value)) throw new Error('Valor inválido');

  const goal = await prisma.goal.update({
    where: { id, userId },
    data: { currentAmount: { increment: value } },
  });
  return toGoalItem(goal);
}

/** Lança erro (P2025) se a meta não existir ou for de outro usuário. */
export async function deleteGoal(userId: string, id: string) {
  await prisma.goal.delete({
    where: { id, userId },
  });
}
