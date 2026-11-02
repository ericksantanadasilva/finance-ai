import {
  getTransactionsPage,
  type TransactionFilters,
} from '@/app/_actions/transactions';
import { generateDueRecurring } from '@/app/_actions/recurring';
import TransactionsClient from '@/app/_Components/TransactionsClient';
import TransactionsSkeleton from '@/app/_Components/TransactionSkeleton';
import { APP_TIME_ZONE, currentMonthISO } from '@/app/utils/dates';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

const toNumber = (v: string | undefined) => {
  if (!v) return undefined;
  const n = Number(v.replace(',', '.'));
  return isNaN(n) ? undefined : n;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const type = first(params.type);
  const sort = first(params.sort);
  const status = first(params.status);
  const currentMonth = currentMonthISO(APP_TIME_ZONE);

  const filters: TransactionFilters = {
    q: first(params.q),
    category: first(params.category),
    // Sem mês na URL abre no mês atual; "all" (Todos os Meses) não filtra
    month: first(params.month) ?? currentMonth,
    type: type === 'income' || type === 'expense' ? type : undefined,
    status: status === 'paid' || status === 'pending' ? status : undefined,
    minAmount: toNumber(first(params.min)),
    maxAmount: toNumber(first(params.max)),
    sort:
      sort === 'date_asc' || sort === 'amount_desc' || sort === 'amount_asc'
        ? sort
        : 'date_desc',
    page: toNumber(first(params.page)) ?? 1,
  };

  return (
    <Suspense fallback={<TransactionsSkeleton />}>
      <TransactionsDataFetch filters={filters} currentMonth={currentMonth} />
    </Suspense>
  );
}

export async function TransactionsDataFetch({
  filters,
  currentMonth,
}: {
  filters: TransactionFilters;
  currentMonth: string;
}) {
  // Cria as ocorrências recorrentes devidas (idempotente) antes de listar
  await generateDueRecurring();
  const data = await getTransactionsPage(filters);

  return <TransactionsClient data={data} currentMonth={currentMonth} />;
}
