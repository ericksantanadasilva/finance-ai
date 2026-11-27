// Regras recorrentes por usuário, usadas pelas server actions e pelas rotas da API.
// Sem 'use server': o userId vem de quem chama, depois de autenticar.
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/prisma/generated/client';
import { APP_TIME_ZONE, currentMonthISO } from '@/app/utils/dates';
import { resolveCategoryForUse } from './categories';

const MONTH_RE = /^\d{4}-\d{2}$/;
const MAX_CATCH_UP_MONTHS = 36; // trava de segurança contra loops/backfills enormes

const pad = (n: number) => String(n).padStart(2, '0');

function currentMonth() {
  return currentMonthISO(APP_TIME_ZONE);
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export type RecurringRuleItem = {
  id: string;
  description: string;
  amount: number;
  type: string;
  dayOfMonth: number;
  startMonth: string;
  active: boolean;
  lastGeneratedMonth: string | null;
  category: { name: string; color: string } | null;
};

// Campos de RecurringRuleItem: usados na listagem e na resposta das rotas de escrita
const RULE_ITEM_INCLUDE = {
  category: { select: { name: true, color: true } },
} satisfies Prisma.RecurringRuleInclude;

function toRecurringRuleItem(
  r: Prisma.RecurringRuleGetPayload<{ include: typeof RULE_ITEM_INCLUDE }>,
): RecurringRuleItem {
  return {
    id: r.id,
    description: r.description,
    amount: Number(r.amount),
    type: r.type,
    dayOfMonth: r.dayOfMonth,
    startMonth: r.startMonth,
    active: r.active,
    lastGeneratedMonth: r.lastGeneratedMonth,
    category: r.category,
  };
}

export type RecurringRuleInput = {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  dayOfMonth: number;
  startMonth: string;
};

/**
 * Gera as transações dos meses pendentes de cada regra ativa (até o mês atual).
 * Idempotente: a constraint única (recurringRuleId, referenceDate) e o
 * lastGeneratedMonth garantem que nada é criado duas vezes nem recriado
 * depois que o usuário apaga uma ocorrência.
 * Não chama revalidatePath, então pode ser usada durante a renderização.
 */
export async function generateForUser(userId: string) {
  const rules = await prisma.recurringRule.findMany({
    where: { userId, active: true },
  });
  const now = currentMonth();
  let created = 0;

  for (const rule of rules) {
    let month = rule.lastGeneratedMonth
      ? shiftMonth(rule.lastGeneratedMonth, 1)
      : rule.startMonth;
    if (month > now) continue;

    const data = [];
    let last = rule.lastGeneratedMonth;

    while (month <= now && data.length < MAX_CATCH_UP_MONTHS) {
      const [year, m] = month.split('-').map(Number);
      const lastDay = new Date(year, m, 0).getDate();
      const day = Math.min(rule.dayOfMonth, lastDay);

      data.push({
        description: rule.description,
        amount: rule.amount,
        type: rule.type,
        date: new Date(year, m - 1, day, 12, 0, 0),
        referenceDate: new Date(year, m - 1, 1, 12, 0, 0),
        // Meses passados já ocorreram; o mês corrente fica pendente até ser marcado como pago
        isPaid: month < now,
        isRecurring: true,
        categoryId: rule.categoryId,
        userId,
        recurringRuleId: rule.id,
      });
      last = month;
      month = shiftMonth(month, 1);
    }

    if (data.length === 0) continue;

    const [result] = await prisma.$transaction([
      prisma.transaction.createMany({ data, skipDuplicates: true }),
      prisma.recurringRule.update({
        where: { id: rule.id },
        data: { lastGeneratedMonth: last },
      }),
    ]);
    created += result.count;
  }

  return created;
}

export async function getRecurringRules(
  userId: string,
): Promise<RecurringRuleItem[]> {
  const rules = await prisma.recurringRule.findMany({
    where: { userId },
    orderBy: [{ active: 'desc' }, { description: 'asc' }],
    include: RULE_ITEM_INCLUDE,
  });

  return rules.map(toRecurringRuleItem);
}

/** RecurringRuleItem por id, ou null se não existir ou for de outro usuário. */
export async function getRecurringRuleItem(userId: string, id: string) {
  const rule = await prisma.recurringRule.findFirst({
    where: { id, userId },
    include: RULE_ITEM_INCLUDE,
  });
  return rule ? toRecurringRuleItem(rule) : null;
}

/**
 * Valida, cria a regra e já gera as ocorrências devidas (do mês de início até o atual).
 * Entrada inválida volta como { success: false, error }; falhas do banco lançam erro.
 */
export async function createRecurringRule(
  userId: string,
  input: RecurringRuleInput,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const description = input.description?.trim();
  const dayOfMonth = Math.floor(Number(input.dayOfMonth));
  if (!description) return { success: false, error: 'Informe a descrição.' };
  if (!(input.amount > 0)) return { success: false, error: 'Valor inválido.' };
  if (!(dayOfMonth >= 1 && dayOfMonth <= 31))
    return { success: false, error: 'Dia deve estar entre 1 e 31.' };
  if (!MONTH_RE.test(input.startMonth))
    return { success: false, error: 'Mês de início inválido.' };
  if (input.type !== 'income' && input.type !== 'expense')
    return { success: false, error: 'Tipo inválido.' };

  let categoryId: string | null = null;
  if (input.category?.trim()) {
    const category = await resolveCategoryForUse(
      userId,
      input.category,
      input.type,
    );
    categoryId = category.id;
  }

  const rule = await prisma.recurringRule.create({
    data: {
      description,
      amount: input.amount,
      type: input.type,
      dayOfMonth,
      startMonth: input.startMonth,
      categoryId,
      userId,
    },
  });

  await generateForUser(userId);

  return { success: true, id: rule.id };
}

/** Pausa ou retoma a regra. Retorna false se ela não existir ou for de outro usuário. */
export async function toggleRecurringRule(
  userId: string,
  id: string,
  active: boolean,
) {
  const rule = await prisma.recurringRule.findFirst({
    where: { id, userId },
  });
  if (!rule) return false;

  // Ao retomar, continua a partir do mês atual em vez de preencher o período pausado
  let lastGeneratedMonth = rule.lastGeneratedMonth;
  if (active && rule.startMonth <= currentMonth()) {
    const previous = shiftMonth(currentMonth(), -1);
    if (!lastGeneratedMonth || lastGeneratedMonth < previous) {
      lastGeneratedMonth = previous;
    }
  }

  await prisma.recurringRule.update({
    where: { id },
    data: { active, lastGeneratedMonth },
  });

  if (active) await generateForUser(userId);

  return true;
}

/**
 * Exclui a regra. As transações já geradas continuam no histórico.
 * Retorna false se ela não existir ou for de outro usuário.
 */
export async function deleteRecurringRule(userId: string, id: string) {
  const result = await prisma.recurringRule.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
