// Metas por usuário, usadas pelas server actions e pelas rotas da API.
// Sem 'use server': o userId vem de quem chama, depois de autenticar.
import { prisma } from '@/lib/prisma';
import { parseDateOnly } from '@/app/utils/dates';

export type GoalInput = {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // YYYY-MM-DD
};

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
  await prisma.goal.create({
    data: {
      name: data.name,
      targetAmount: Number(data.targetAmount),
      currentAmount: Number(data.currentAmount),
      deadline: parseDeadline(data.deadline),
      userId,
    },
  });
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

/** Aporte: soma o valor ao atual. Lança erro se o valor for inválido ou a meta não for do usuário. */
export async function addToGoal(userId: string, id: string, amountToAdd: number) {
  const value = Number(amountToAdd);
  if (isNaN(value)) throw new Error('Valor inválido');

  await prisma.goal.update({
    where: { id, userId },
    data: { currentAmount: { increment: value } },
  });
}

/** Lança erro (P2025) se a meta não existir ou for de outro usuário. */
export async function deleteGoal(userId: string, id: string) {
  await prisma.goal.delete({
    where: { id, userId },
  });
}
