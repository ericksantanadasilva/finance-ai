import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMobileUser } from '@/lib/api-auth';
import { notFoundResponse, parseJsonBody } from '@/lib/api-validation';
import {
  deleteRecurringRule,
  getRecurringRuleItem,
  toggleRecurringRule,
  updateRecurringRule,
} from '@/lib/finance/recurring';
import { recurringBodySchema } from '../schema';

type Context = { params: Promise<{ id: string }> };

// Pausar / retomar: só quando active é a única chave do body
const activeSchema = z.object({ active: z.boolean() });
// Edição completa: os campos da criação e, opcionalmente, active
const editSchema = recurringBodySchema.extend({
  active: z.boolean().optional(),
});

function internalError(message: string, error: unknown) {
  console.error(message, error);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

/**
 * Pausa/retoma ou edita a regra, escolhendo pelas chaves do body (como o
 * PATCH /transactions/:id). `{ active }` sozinho é pausar/retomar: retomar
 * continua do mês atual, sem preencher o período pausado. Qualquer outro body é
 * a edição completa, que vale do próximo mês em diante; com `active`, a regra
 * também é pausada ou retomada depois de editada.
 */
export async function PATCH(request: Request, { params }: Context) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const raw: unknown = await request
    .clone()
    .json()
    .catch(() => undefined);
  const isActiveBody =
    typeof raw === 'object' &&
    raw !== null &&
    'active' in raw &&
    Object.keys(raw).length === 1;

  try {
    if (isActiveBody) {
      const { data: body, errorResponse: bodyError } = await parseJsonBody(
        request,
        activeSchema,
      );
      if (bodyError) return bodyError;

      const updated = await toggleRecurringRule(user.id, id, body.active);
      const rule = updated ? await getRecurringRuleItem(user.id, id) : null;
      if (!rule) return notFoundResponse();
      return NextResponse.json({ rule });
    }

    const { data: body, errorResponse: bodyError } = await parseJsonBody(
      request,
      editSchema,
    );
    if (bodyError) return bodyError;

    const { active, ...input } = body;
    const result = await updateRecurringRule(user.id, id, {
      ...input,
      category: input.category ?? '',
    });
    if (!result.success) {
      if (result.notFound) return notFoundResponse();
      // Segunda barreira: a validação do service (ex.: início em mês já lançado)
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Depois da edição: ao retomar, o mês atual já sai com os dados novos
    if (active !== undefined) {
      await toggleRecurringRule(user.id, id, active);
    }

    const rule = await getRecurringRuleItem(user.id, id);
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
