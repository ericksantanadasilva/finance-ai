// Regras de categorias e orçamento por usuário, usadas pelas server actions e pelas rotas da API.
// Sem 'use server': o userId vem de quem chama, depois de autenticar.
import { isUniqueViolation, prisma } from '@/lib/prisma';
import type { TransactionType } from '@/prisma/generated/client';
import { APP_TIME_ZONE, currentMonthISO } from '@/app/utils/dates';

/** Cor da categoria criada sem escolha de cor (lançamento, recorrência, importação, n8n). */
export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  Alimentação: '#ef4444',
  Transporte: '#3b82f6',
  Lazer: '#8b5cf6',
  Casa: '#f59e0b',
  Saúde: '#10b981',
  Geral: '#71717a',
};
const FALLBACK_CATEGORY_COLOR = '#71717a';

/**
 * Nome como fica gravado (sem os espaços das pontas) e a chave de comparação
 * (também em minúsculas). Dois nomes são a mesma categoria quando a chave é igual.
 */
export function normalizeCategoryName(name: string) {
  const trimmed = name.trim();
  return { name: trimmed, nameKey: trimmed.toLowerCase() };
}

/**
 * Categoria do usuário com esse nome, arquivada ou não.
 * Até a migration da 9h, categorias criadas pelo código antigo podem estar com
 * nameKey nulo; essas só são achadas pelo nome exato. Remover o OR na 9h.
 */
function findCategoryByName(userId: string, name: string, nameKey: string) {
  return prisma.category.findFirst({
    where: { userId, OR: [{ nameKey }, { nameKey: null, name }] },
    orderBy: { nameKey: { sort: 'asc', nulls: 'last' } },
  });
}

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

/** Categorias ativas (listas de escolha). As arquivadas ficam fora. */
export async function getCategories(userId: string) {
  const categories = await prisma.category.findMany({
    where: { userId, archivedAt: null },
    orderBy: { name: 'asc' },
  });

  // Decimal não é serializável para Client Components
  return categories.map((c) => ({
    ...c,
    budget: c.budget === null ? null : Number(c.budget),
  }));
}

/**
 * Categorias ativas com o limite mensal e quanto já foi gasto no mês de competência
 * (referenceDate, o mesmo critério do restante do app). Com `categoryId`, só essa categoria.
 */
export async function getCategoriesWithBudget(
  userId: string,
  month?: string,
  categoryId?: string,
) {
  const [categories, spentByCategory] = await Promise.all([
    prisma.category.findMany({
      where: { userId, id: categoryId, archivedAt: null },
      orderBy: { name: 'asc' },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        categoryId,
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

function assertValidBudget(budget: number | null | undefined) {
  if (budget != null && (isNaN(budget) || budget < 0)) {
    throw new Error('Limite inválido');
  }
}

/** Retorna false se a categoria não existir, estiver arquivada ou for de outro usuário. */
export async function setCategoryBudget(
  userId: string,
  id: string,
  budget: number | null,
) {
  assertValidBudget(budget);

  // updateMany garante que só altera categorias do próprio usuário
  const result = await prisma.category.updateMany({
    where: { id, userId, archivedAt: null },
    data: { budget: budget && budget > 0 ? budget : null },
  });
  return result.count > 0;
}

/**
 * Situação do orçamento de uma categoria no mês (usado para alertar após lançar gastos).
 */
export async function getBudgetStatus(
  userId: string,
  categoryName: string,
  month?: string,
): Promise<BudgetStatus | null> {
  const { name, nameKey } = normalizeCategoryName(categoryName);
  const category = await findCategoryByName(userId, name, nameKey);
  if (category?.archivedAt || !category?.budget || Number(category.budget) <= 0)
    return null;

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

export type CreateCategoryResult =
  | { status: 'created' | 'reactivated'; id: string }
  | { status: 'conflict' }; // já existe uma ativa com o mesmo nome

/**
 * Cria a categoria ou, se houver uma arquivada com o mesmo nome, reativa a
 * mesma linha: o nome passa a ser o digitado, a cor nova vale também para as
 * transações antigas, e o limite é o informado agora (o antigo nunca volta).
 */
export async function createCategory(
  userId: string,
  name: string,
  color: string,
  budget?: number | null,
): Promise<CreateCategoryResult> {
  assertValidBudget(budget);
  const normalized = normalizeCategoryName(name);
  if (!normalized.name) throw new Error('Nome inválido');

  const data = {
    ...normalized,
    color,
    budget: budget && budget > 0 ? budget : null,
  };

  const existing = await findCategoryByName(
    userId,
    normalized.name,
    normalized.nameKey,
  );
  if (existing && !existing.archivedAt) return { status: 'conflict' };

  try {
    if (existing) {
      // O filtro por archivedAt faz só uma de duas reativações simultâneas valer
      const result = await prisma.category.updateMany({
        where: { id: existing.id, userId, archivedAt: { not: null } },
        data: { ...data, archivedAt: null },
      });
      return result.count > 0
        ? { status: 'reactivated', id: existing.id }
        : { status: 'conflict' };
    }

    const category = await prisma.category.create({
      data: { ...data, type: 'expense', userId },
    });
    return { status: 'created', id: category.id };
  } catch (error) {
    // Outra requisição criou o mesmo nome entre a busca e a escrita
    if (isUniqueViolation(error)) return { status: 'conflict' };
    throw error;
  }
}

/**
 * Categoria para um lançamento ou uma recorrência, pelo nome; criada se não
 * existir. Uma arquivada é mantida quando já é a categoria atual do registro
 * (`currentCategoryId`, na edição) e, fora disso, reativada com a cor antiga e
 * sem limite. Usada onde não há escolha de cor (lançamento, chat, importação, n8n).
 */
export async function resolveCategoryForUse(
  userId: string,
  name: string,
  type: TransactionType,
  currentCategoryId?: string | null,
) {
  const normalized = normalizeCategoryName(name);
  if (!normalized.name) throw new Error('Categoria inválida');

  const existing = await findCategoryByName(
    userId,
    normalized.name,
    normalized.nameKey,
  );
  if (existing) {
    if (!existing.archivedAt || existing.id === currentCategoryId) {
      return existing;
    }
    return prisma.category.update({
      where: { id: existing.id },
      data: { archivedAt: null, budget: null, nameKey: normalized.nameKey },
    });
  }

  try {
    return await prisma.category.create({
      data: {
        ...normalized,
        type,
        userId,
        color: DEFAULT_CATEGORY_COLORS[normalized.name] ?? FALLBACK_CATEGORY_COLOR,
      },
    });
  } catch (error) {
    // Outra requisição criou a mesma categoria entre a busca e o create
    if (!isUniqueViolation(error)) throw error;
    const created = await findCategoryByName(
      userId,
      normalized.name,
      normalized.nameKey,
    );
    if (!created) throw error;
    return created;
  }
}

/**
 * Arquiva a categoria (soft delete): as transações continuam com ela e as
 * recorrências ativas continuam gerando com ela. Devolve quantas recorrências
 * ativas a usam, ou null se ela não existir, já estiver arquivada ou for de outro usuário.
 */
export async function archiveCategory(userId: string, id: string) {
  const result = await prisma.category.updateMany({
    where: { id, userId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  if (result.count === 0) return null;

  const activeRecurringRules = await prisma.recurringRule.count({
    where: { userId, categoryId: id, active: true },
  });
  return { activeRecurringRules };
}

export async function deleteCategory(userId: string, id: string) {
  // O filtro por userId garante que o usuário só apaga o que pertence a ele
  await prisma.category.delete({
    where: { id, userId },
  });
}
