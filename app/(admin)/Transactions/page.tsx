import { getAllTransactions } from '@/app/_actions/transactions';
import TransactionsClient from '@/app/_Components/TransactionsClient';
import TransactionsSkeleton from '@/app/_Components/TransactionSkeleton';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsSkeleton />}>
      <TransactionsDataFetch />
    </Suspense>
  );
}

export async function TransactionsDataFetch() {
  const transactions = await getAllTransactions();

  return <TransactionsClient initialTransactions={transactions} />;
}
