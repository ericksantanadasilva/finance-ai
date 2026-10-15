'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ensureDbUser } from '@/lib/ensure-user';

const MONTH_RE = /^\d{4}-\d{2}$/;
const MAX_CATCH_UP_MONTHS = 36; // trava de segurança contra loops/backfills enormes

const pad = (n: number) => String(n).padStart(2, '0');

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');
  return user;
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

/**
 * Gera as transações dos meses pendentes de cada regra ativa (até o mês atual).
 * Idempotente: a constraint única (recurringRuleId, referenceDate) e o
 * lastGeneratedMonth garantem que nada é criado duas vezes nem recriado
 * depois que o usuário apaga uma ocorrência.
 * Não chama revalidatePath, então pode ser usada durante a renderização.
 */
async function generateForUser(userId: string) {
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

/** Usada pelas páginas para garantir que as recorrentes do mês existem. */
export async function generateDueRecurring() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;
    return await generateForUser(user.id);
  } catch (error) {
    console.error('Erro ao gerar recorrentes:', error);
    return 0;
  }
}

export async function getRecurringRules(): Promise<RecurringRuleItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const rules = await prisma.recurringRule.findMany({
    where: { userId: user.id },
    orderBy: [{ active: 'desc' }, { description: 'asc' }],
    include: { category: { select: { name: true, color: true } } },
  });

  return rules.map((r) => ({
    id: r.id,
    description: r.description,
    amount: Number(r.amount),
    type: r.type,
    dayOfMonth: r.dayOfMonth,
    startMonth: r.startMonth,
    active: r.active,
    lastGeneratedMonth: r.lastGeneratedMonth,
    category: r.category,
  }));
}

export async function createRecurringRule(input: {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  dayOfMonth: number;
  startMonth: string;
}) {
  const user = await requireUser();

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

  try {
    await ensureDbUser(user);

    let categoryId: string | null = null;
    if (input.category?.trim()) {
      const category = await prisma.category.upsert({
        where: {
          name_userId: { name: input.category.trim(), userId: user.id },
        },
        update: {},
        create: {
          name: input.category.trim(),
          type: input.type,
          userId: user.id,
          color: '#71717a',
        },
      });
      categoryId = category.id;
    }

    await prisma.recurringRule.create({
      data: {
        description,
        amount: input.amount,
        type: input.type,
        dayOfMonth,
        startMonth: input.startMonth,
        categoryId,
        userId: user.id,
      },
    });

    // Já cria as ocorrências devidas (do mês de início até o mês atual)
    await generateForUser(user.id);

    revalidatePath('/Recurring');
    revalidatePath('/Transactions');
    revalidatePath('/Dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar recorrência:', error);
    return { success: false, error: 'Erro ao salvar.' };
  }
}

export async function toggleRecurringRule(id: string, active: boolean) {
  const user = await requireUser();

  const rule = await prisma.recurringRule.findFirst({
    where: { id, userId: user.id },
  });
  if (!rule) return { success: false };

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

  if (active) await generateForUser(user.id);

  revalidatePath('/Recurring');
  revalidatePath('/Transactions');
  revalidatePath('/Dashboard');
  return { success: true };
}

/** Exclui a regra. As transações já geradas continuam no histórico. */
export async function deleteRecurringRule(id: string) {
  const user = await requireUser();

  await prisma.recurringRule.deleteMany({ where: { id, userId: user.id } });

  revalidatePath('/Recurring');
  revalidatePath('/Transactions');
  return { success: true };
}
