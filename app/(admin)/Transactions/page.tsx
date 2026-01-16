import { getAllTransactions } from '@/app/_actions/transactions';
import TransactionsClient from '@/app/_Components/TransactionsClient';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const transactions = await getAllTransactions();

  return <TransactionsClient initialTransactions={transactions} />;
}
