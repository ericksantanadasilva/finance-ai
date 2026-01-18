import { getGoals } from '@/app/_actions/goals';
import GoalsClient from '@/app/_Components/GoalsClient';

export default async function GoalsPage() {
  const goals = await getGoals();

  // Convertemos os tipos do Prisma (Decimal/Date) para tipos que o Client entende (Number/String)
  const serializedGoals = goals.map((goal) => ({
    id: goal.id,
    name: goal.name,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    deadline: goal.deadline
      ? new Date(goal.deadline).toLocaleDateString('pt-BR')
      : 'Sem prazo',
  }));

  return <GoalsClient initialGoals={serializedGoals} />;
}
