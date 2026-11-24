import { getGoals } from '@/app/_actions/goals';
import GoalsClient from '@/app/_Components/GoalsClient';
import GoalsSkeleton from '@/app/_Components/GoalsSkeleton';
import { Goal } from 'lucide-react';
import { Suspense } from 'react';
import { formatDateOnly } from '@/app/utils/dates';

export default async function GoalsPage() {
  return (
    <Suspense fallback={<GoalsSkeleton />}>
      <GoalsDataFetch />
    </Suspense>
  );
}

export async function GoalsDataFetch() {
  const goals = await getGoals();

  // Convertemos os tipos do Prisma (Decimal/Date) para tipos que o Client entende (Number/String)
  const serializedGoals = goals.map((goal) => ({
    id: goal.id,
    name: goal.name,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    deadline: goal.deadline
      ? formatDateOnly(goal.deadline)
      : 'Sem prazo',
    // Para o ritmo da meta: prazo em "YYYY-MM-DD" (gravado ao meio-dia UTC,
    // então a data UTC é o dia certo) e início em ISO
    deadlineDate: goal.deadline
      ? goal.deadline.toISOString().slice(0, 10)
      : null,
    createdAt: goal.createdAt.toISOString(),
  }));

  // Instante do ritmo das metas, o mesmo no servidor e na hidratação. Server
  // Component: renderiza uma vez por requisição, e é esse instante que se quer.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return <GoalsClient initialGoals={serializedGoals} now={now} />;
}
