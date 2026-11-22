import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMobileUser } from '@/lib/api-auth';
import { notFoundResponse, parseJsonBody } from '@/lib/api-validation';
import {
  deleteRecurringRule,
  getRecurringRuleItem,
  toggleRecurringRule,
} from '@/lib/finance/recurring';

type Context = { params: Promise<{ id: string }> };

const bodySchema = z.object({ active: z.boolean() });

function internalError(message: string, error: unknown) {
  console.error(message, error);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

/** Pausa ou retoma a regra. Retomar continua do mês atual, sem preencher o período pausado. */
export async function PATCH(request: Request, { params }: Context) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { data: body, errorResponse: bodyError } = await parseJsonBody(
    request,
    bodySchema,
  );
  if (bodyError) return bodyError;

  const { id } = await params;
  try {
    const updated = await toggleRecurringRule(user.id, id, body.active);
    const rule = updated ? await getRecurringRuleItem(user.id, id) : null;
    if (!rule) return notFoundResponse();
    return NextResponse.json({ rule });
  } catch (error) {
    return internalError('Erro ao alterar recorrência (mobile):', error);
  }
}

/** Exclui a regra. As transações já geradas continuam no histórico. */
export async function DELETE(request: Request, { params }: Context) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    const deleted = await deleteRecurringRule(user.id, id);
    if (!deleted) return notFoundResponse();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return internalError('Erro ao excluir recorrência (mobile):', error);
  }
}
