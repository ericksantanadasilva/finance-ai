// Regras de categorias e orçamento por usuário, usadas pelas server actions e pelas rotas da API.
// Sem 'use server': o userId vem de quem chama, depois de autenticar.
import { prisma } from '@/lib/prisma';
import { APP_TIME_ZONE, currentMonthISO } from '@/app/utils/dates';

export type BudgetStatus = {
  category: string;
  spent: number;
  budget: number;
  percent: number;
};

/** Percentual em 2 casas: tira o resíduo de ponto flutuante (ex.: 99.99999999999999) antes de comparar com 80/100. */
function budgetPercent(spent: number, budget: number) {
  return Math.round((spent / budget) * 10000) / 100;
}

function monthRange(month?: string) {
  const base =
    month && /^\d{4}-\d{2}$/.test(month)
      ? month
      : currentMonthISO(APP_TIME_ZONE);
  const [year, m] = base.split('-').map(Number);
  return {
    gte: new Date(year, m - 1, 1),
    lt: new Date(year, m, 1),
  };
}

export async function getCategories(userId: string) {
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });

  // Decimal não é serializável para Client Components
  return categories.map((c) => ({
    ...c,
    budget: c.budget === null ? null : Number(c.budget),
  }));
}

/**
 * Categorias com o limite mensal e quanto já foi gasto no mês de competência
 * (referenceDate, o mesmo critério do restante do app).
 */
export async function getCategoriesWithBudget(userId: string, month?: string) {
  const [categories, spentByCategory] = await Promise.all([
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'expense',
        referenceDate: monthRange(month),
      },
      _sum: { amount: true },
    }),
  ]);

  return categories.map((c) => {
    const spent = Number(
      spentByCategory.find((s) => s.categoryId === c.id)?._sum.amount ?? 0,
    );
    const budget = c.budget === null ? null : Number(c.budget);
    return {
      id: c.id,
      name: c.name,
      color: c.color,
      budget,
      spent,
      percent: budget && budget > 0 ? budgetPercent(spent, budget) : null,
    };
  });
}

export async function setCategoryBudget(
  userId: string,
  id: string,
  budget: number | null,
) {
  if (budget !== null && (isNaN(budget) || budget < 0)) {
    throw new Error('Limite inválido');
  }

  // updateMany garante que só altera categorias do próprio usuário
  await prisma.category.updateMany({
    where: { id, userId },
    data: { budget: budget && budget > 0 ? budget : null },
  });
}

/**
 * Situação do orçamento de uma categoria no mês (usado para alertar após lançar gastos).
 */
export async function getBudgetStatus(
  userId: string,
  categoryName: string,
  month?: string,
): Promise<BudgetStatus | null> {
  const category = await prisma.category.findUnique({
    where: { name_userId: { name: categoryName, userId } },
  });
  if (!category?.budget || Number(category.budget) <= 0) return null;

  const agg = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId: category.id,
      type: 'expense',
      referenceDate: monthRange(month),
    },
    _sum: { amount: true },
  });

  const spent = Number(agg._sum.amount ?? 0);
  const budget = Number(category.budget);
  return {
    category: category.name,
    spent,
    budget,
    percent: budgetPercent(spent, budget),
  };
}

export async function createCategory(
  userId: string,
  name: string,
  color: string,
  budget?: number | null,
) {
  await prisma.category.create({
    data: {
      name,
      color,
      type: 'expense',
      budget: budget && budget > 0 ? budget : null,
      userId,
    },
  });
}

export async function deleteCategory(userId: string, id: string) {
  // O filtro por userId garante que o usuário só apaga o que pertence a ele
  await prisma.category.delete({
    where: { id, userId },
  });
}
