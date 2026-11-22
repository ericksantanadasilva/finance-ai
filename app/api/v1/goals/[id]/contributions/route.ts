import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMobileUser } from '@/lib/api-auth';
import {
  isRecordNotFound,
  moneySchema,
  notFoundResponse,
  parseJsonBody,
} from '@/lib/api-validation';
import { addToGoal } from '@/lib/finance/goals';

type Context = { params: Promise<{ id: string }> };

// > 0: o service aceita zero e negativo
const bodySchema = z.object({ amount: moneySchema });

/** Aporte na meta (incremento atômico). Passar do objetivo é permitido. */
export async function POST(request: Request, { params }: Context) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { data: body, errorResponse: bodyError } = await parseJsonBody(
    request,
    bodySchema,
  );
  if (bodyError) return bodyError;

  const { id } = await params;
  try {
    const goal = await addToGoal(user.id, id, body.amount);
    return NextResponse.json({ goal });
  } catch (error) {
    if (isRecordNotFound(error)) return notFoundResponse();
    console.error('Erro ao registrar aporte na meta (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
