import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMobileUser } from '@/lib/api-auth';
import {
  dateOnlySchema,
  moneySchema,
  nonNegativeMoneySchema,
  parseJsonBody,
} from '@/lib/api-validation';
import { createGoal, getGoals, toGoalItem } from '@/lib/finance/goals';

/**
 * Metas do usuário, com valores em número, prazo em "YYYY-MM-DD" (ou null) e
 * data de criação (início do ritmo no app).
 */
export async function GET(request: Request) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  try {
    const goals = await getGoals(user.id);
    return NextResponse.json({ goals: goals.map(toGoalItem) });
  } catch (error) {
    console.error('Erro ao buscar metas (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  targetAmount: moneySchema,
  currentAmount: nonNegativeMoneySchema.default(0),
  // Data inválida dá 400 (o service a transformaria em "sem prazo")
  deadline: dateOnlySchema.nullable().optional(),
});

/** Cria a meta. Responde com o item no formato de GET /goals. */
export async function POST(request: Request) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { data: body, errorResponse: bodyError } = await parseJsonBody(
    request,
    createSchema,
  );
  if (bodyError) return bodyError;

  try {
    const goal = await createGoal(user.id, {
      ...body,
      deadline: body.deadline ?? undefined,
    });
    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar meta (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
