'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSessionUser, requireUser } from '@/lib/auth';
import { ensureDbUser } from '@/lib/ensure-user';
import { APP_TIME_ZONE, currentMonthISO } from '@/app/utils/dates';

export async function getCategories() {
  const user = await getSessionUser();

  if (!user) return [];

  const categories = await prisma.category.findMany({
    where: {
      userId: user.id, // Filtra para retornar apenas as categorias do dono
    },
    orderBy: { name: 'asc' },
  });

  // Decimal não é serializável para Client Components
  return categories.map((c) => ({
    ...c,
    budget: c.budget === null ? null : Number(c.budget),
  }));
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

/**
 * Categorias com o limite mensal e quanto já foi gasto no mês de competência
 * (referenceDate, o mesmo critério do restante do app).
 */
export async function getCategoriesWithBudget(month?: string) {
  const user = await getSessionUser();

  if (!user) return [];

  const [categories, spentByCategory] = await Promise.all([
    prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId: user.id,
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
      percent: budget && budget > 0 ? (spent / budget) * 100 : null,
    };
  });
}

export async function setCategoryBudget(id: string, budget: number | null) {
  const user = await requireUser();

  if (budget !== null && (isNaN(budget) || budget < 0)) {
    throw new Error('Limite inválido');
  }

  // updateMany garante que só altera categorias do próprio usuário
  await prisma.category.updateMany({
    where: { id, userId: user.id },
    data: { budget: budget && budget > 0 ? budget : null },
  });

  revalidatePath('/Categories');
  revalidatePath('/Dashboard');
}

export type BudgetStatus = {
  category: string;
  spent: number;
  budget: number;
  percent: number;
};

/**
 * Situação do orçamento de uma categoria no mês (usado para alertar após lançar gastos).
 */
export async function getBudgetStatus(
  categoryName: string,
  month?: string,
): Promise<BudgetStatus | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const category = await prisma.category.findUnique({
    where: { name_userId: { name: categoryName, userId: user.id } },
  });
  if (!category?.budget || Number(category.budget) <= 0) return null;

  const agg = await prisma.transaction.aggregate({
    where: {
      userId: user.id,
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
    percent: (spent / budget) * 100,
  };
}

export async function createCategory(
  name: string,
  color: string,
  budget?: number | null,
) {
  const user = await requireUser();
  await ensureDbUser(user);

  await prisma.category.create({
    data: {
      name,
      color,
      type: 'expense',
      budget: budget && budget > 0 ? budget : null,
      userId: user.id, // Vincula a nova categoria ao ID real do Supabase
    },
  });

  revalidatePath('/Categories');
  revalidatePath('/import');
  revalidatePath('/Dashboard'); // Importante para atualizar o gráfico de fatias
}

export async function deleteCategory(id: string) {
  const user = await requireUser();

  // Onde: garantimos que o usuário só pode deletar o que pertence a ele
  await prisma.category.delete({
    where: {
      id,
      userId: user.id, // Camada extra de segurança
    },
  });

  revalidatePath('/Categories');
  revalidatePath('/Dashboard');
}
