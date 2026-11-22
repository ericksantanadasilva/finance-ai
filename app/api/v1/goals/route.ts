import { NextResponse } from 'next/server';
import { requireMobileUser } from '@/lib/api-auth';
import { getGoals } from '@/lib/finance/goals';

/**
 * Metas do usuário, com valores em número, prazo em "YYYY-MM-DD" (ou null) e
 * data de criação (início do ritmo no app).
 */
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
        // Início do ritmo da meta (ISO completo)
        createdAt: goal.createdAt.toISOString(),
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
