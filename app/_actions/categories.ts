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

/** Nomes para as listas de escolha (lançamento e recorrência). */
export async function getCategoryOptions() {
  const user = await getSessionUser();
  if (!user) return [];

  return categoriesService.getCategoryOptions(user.id);
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

// A cor aparece em todas as telas que mostram a categoria
function revalidateCategoryViews() {
  revalidatePath('/Categories');
  revalidatePath('/Dashboard');
  revalidatePath('/Transactions');
  revalidatePath('/Recurring');
}

/** Altera o limite e/ou a cor. Retorna false se a categoria não existir ou estiver arquivada. */
export async function updateCategory(
  id: string,
  changes: { budget?: number | null; color?: string },
) {
  const user = await requireUser();

  const updated = await categoriesService.updateCategory(user.id, id, changes);
  if (updated) revalidateCategoryViews();
  return updated;
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
  if (result.status === 'conflict') return result;

  // Reativar muda a cor das transações antigas
  revalidateCategoryViews();
  revalidatePath('/import');
  return result;
}

/**
 * Arquiva a categoria. Devolve quantas recorrências ativas continuam usando
 * ela, ou null se ela não existir ou já estiver arquivada.
 */
export async function archiveCategory(id: string) {
  const user = await requireUser();

  const result = await categoriesService.archiveCategory(user.id, id);
  if (result) revalidateCategoryViews();
  return result;
}
