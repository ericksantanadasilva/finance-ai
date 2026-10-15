import { getTransactions } from '@/app/_actions/transactions'; // Busca do banco
import { generateDueRecurring } from '@/app/_actions/recurring';
import DashboardClient from '@/app/_Components/DashboardClient'; // Componente visual
import { Suspense } from 'react';
import DashboardSkeleton from '@/app/_Components/DashboardSkeleton';

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}

// Componente interno que realmente busca os dados
async function DashboardData() {
  await generateDueRecurring();
  const transactions = await getTransactions();
  return <DashboardClient initialTransactions={transactions} />;
}
