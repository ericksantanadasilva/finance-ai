'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser, requireUser } from '@/lib/auth';
import * as transactionsService from '@/lib/finance/transactions';
import type {
  TransactionFilters,
  TransactionItem,
} from '@/lib/finance/transactions';

export async function createTransaction(data: any, referenceMounth: string) {
  const user = await requireUser();

  try {
    const { budgetAlert } = await transactionsService.createTransaction(
      user.id,
      data,
      referenceMounth,
    );

    revalidatePath('/Dashboard');
    revalidatePath('/Transactions');
    revalidatePath('/Categories');

    return { success: true, budgetAlert };
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return { success: false };
  }
}

export async function getTransactions(limit?: number) {
  const user = await getSessionUser();
  if (!user) return [];

  try {
    return await transactionsService.getRecentTransactions(user.id, limit);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }
}

/**
 * Totais por mês de competência, tipo e categoria para o Dashboard.
 * Soma no banco em vez de enviar todas as transações para o navegador;
 * cada linha tem o mesmo formato de uma transação (referenceDate, type, amount, category).
 */
export async function getDashboardTotals() {
  const user = await getSessionUser();
  if (!user) return [];

  try {
    return await transactionsService.getDashboardTotals(user.id);
  } catch (error) {
    console.error('Erro ao buscar totais do dashboard:', error);
    return [];
  }
}

/**
 * Busca paginada com filtros aplicados no banco.
 * Retorna também os totais (receita/despesa) do conjunto filtrado e as
 * opções disponíveis para os selects de categoria e mês.
 */
export async function getTransactionsPage(filters: TransactionFilters = {}) {
  const empty = {
    items: [] as TransactionItem[],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    totals: { income: 0, expense: 0, carryOver: 0, balance: 0 },
    categories: [] as string[],
    months: [] as string[],
  };

  const user = await getSessionUser();
  if (!user) return empty;

  try {
    return await transactionsService.getTransactionsPage(user.id, filters);
  } catch (error) {
    console.error('Erro ao buscar transações paginadas:', error);
    return empty;
  }
}

export async function setTransactionPaid(id: string, isPaid: boolean) {
  const user = await requireUser();
  try {
    const updated = await transactionsService.setTransactionPaid(
      user.id,
      id,
      isPaid,
    );
    if (!updated) return { success: false };
    revalidatePath('/Transactions');
    revalidatePath('/Recurring');
    revalidatePath('/Dashboard'); // o saldo conta só o pago (4i)
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar status de pagamento:', error);
    return { success: false };
  }
}

export async function deleteTransaction(id: string) {
  const user = await requireUser();
  try {
    await transactionsService.deleteTransaction(user.id, id);
    revalidatePath('/Dashboard');
    revalidatePath('/Transactions');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function updateTransaction(
  id: string,
  data: any,
  referenceMounth: string,
) {
  const user = await requireUser();

  try {
    await transactionsService.updateTransaction(
      user.id,
      id,
      data,
      referenceMounth,
    );

    revalidatePath('/Transactions');
    revalidatePath('/Dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    return { success: false };
  }
}
