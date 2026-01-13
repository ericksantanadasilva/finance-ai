import { getTransactions } from '@/app/_actions/transactions'; // Busca do banco
import DashboardClient from '@/app/_Components/DashboardClient'; // Componente visual

// Esta é uma Server Page (Padrão do Next.js)
// Ela roda no servidor, busca os dados e manda pro cliente já pronto.
export default async function DashboardPage() {
  // 1. Buscamos os dados no banco
  const transactions = await getTransactions();

  // 2. Renderizamos o componente Cliente passando os dados
  return <DashboardClient initialTransactions={transactions} />;
}
