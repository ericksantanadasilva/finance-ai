import {
  getTransactionsPage,
  type TransactionFilters,
} from '@/app/_actions/transactions';
import TransactionsClient from '@/app/_Components/TransactionsClient';
import TransactionsSkeleton from '@/app/_Components/TransactionSkeleton';
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

  const filters: TransactionFilters = {
    q: first(params.q),
    category: first(params.category),
    month: first(params.month),
    type: type === 'income' || type === 'expense' ? type : undefined,
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
      <TransactionsDataFetch filters={filters} />
    </Suspense>
  );
}

export async function TransactionsDataFetch({
  filters,
}: {
  filters: TransactionFilters;
}) {
  const data = await getTransactionsPage(filters);

  return <TransactionsClient data={data} />;
}
