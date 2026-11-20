import { NextResponse } from 'next/server';
import { requireMobileUser } from '@/lib/api-auth';
import { getGoals } from '@/lib/finance/goals';

/** Metas do usuário, com valores em número e prazo em "YYYY-MM-DD" (ou null). */
export async function GET(request: Request) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  try {
    const goals = await getGoals(user.id);
    return NextResponse.json({
      goals: goals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
        // Prazos são gravados ao meio-dia UTC (parseDateOnly): a data UTC é o dia certo
        deadline: goal.deadline ? goal.deadline.toISOString().slice(0, 10) : null,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar metas (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
