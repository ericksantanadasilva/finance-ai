'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser, requireUser } from '@/lib/auth';
import * as categoriesService from '@/lib/finance/categories';
import type { BudgetStatus } from '@/lib/finance/categories';

export async function getCategories() {
  const user = await getSessionUser();
  if (!user) return [];

  return categoriesService.getCategories(user.id);
}

/**
 * Categorias com o limite mensal e quanto já foi gasto no mês de competência
 * (referenceDate, o mesmo critério do restante do app).
 */
export async function getCategoriesWithBudget(month?: string) {
  const user = await getSessionUser();
  if (!user) return [];

  return categoriesService.getCategoriesWithBudget(user.id, month);
}

export async function setCategoryBudget(id: string, budget: number | null) {
  const user = await requireUser();

  await categoriesService.setCategoryBudget(user.id, id, budget);

  revalidatePath('/Categories');
  revalidatePath('/Dashboard');
}

/**
 * Situação do orçamento de uma categoria no mês (usado para alertar após lançar gastos).
 */
export async function getBudgetStatus(
  categoryName: string,
  month?: string,
): Promise<BudgetStatus | null> {
  const user = await getSessionUser();
  if (!user) return null;

  return categoriesService.getBudgetStatus(user.id, categoryName, month);
}

export async function createCategory(
  name: string,
  color: string,
  budget?: number | null,
) {
  const user = await requireUser();

  const result = await categoriesService.createCategory(
    user.id,
    name,
    color,
    budget,
  );
  // Mantém o comportamento de antes (erro no nome repetido) até a tela tratar o resultado (9d)
  if (result.status === 'conflict') throw new Error('Categoria já existe');

  revalidatePath('/Categories');
  revalidatePath('/import');
  revalidatePath('/Dashboard'); // Importante para atualizar o gráfico de fatias
}

export async function deleteCategory(id: string) {
  const user = await requireUser();

  await categoriesService.deleteCategory(user.id, id);

  revalidatePath('/Categories');
  revalidatePath('/Dashboard');
}
