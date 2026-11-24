'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser, requireUser } from '@/lib/auth';
import * as recurringService from '@/lib/finance/recurring';
import type {
  RecurringRuleInput,
  RecurringRuleItem,
} from '@/lib/finance/recurring';

/** Usada pelas páginas para garantir que as recorrentes do mês existem. */
export async function generateDueRecurring() {
  // Fora do try: o Next sinaliza o uso de cookies/headers lançando um erro
  // interno, que não deve ser capturado (marca a rota como dinâmica).
  const user = await getSessionUser();
  if (!user) return 0;

  try {
    return await recurringService.generateForUser(user.id);
  } catch (error) {
    console.error('Erro ao gerar recorrentes:', error);
    return 0;
  }
}

export async function getRecurringRules(): Promise<RecurringRuleItem[]> {
  const user = await getSessionUser();
  if (!user) return [];

  return recurringService.getRecurringRules(user.id);
}

export async function createRecurringRule(input: RecurringRuleInput) {
  const user = await requireUser();

  try {
    const result = await recurringService.createRecurringRule(user.id, input);
    if (!result.success) return result;

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

  const updated = await recurringService.toggleRecurringRule(
    user.id,
    id,
    active,
  );
  if (!updated) return { success: false };

  revalidatePath('/Recurring');
  revalidatePath('/Transactions');
  revalidatePath('/Dashboard');
  return { success: true };
}

/** Exclui a regra. As transações já geradas continuam no histórico. */
export async function deleteRecurringRule(id: string) {
  const user = await requireUser();

  await recurringService.deleteRecurringRule(user.id, id);

  revalidatePath('/Recurring');
  revalidatePath('/Transactions');
  return { success: true };
}
