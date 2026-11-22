import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMobileUser } from '@/lib/api-auth';
import {
  isRecordNotFound,
  monthSchema,
  notFoundResponse,
  parseJsonBody,
} from '@/lib/api-validation';
import {
  deleteTransaction,
  getTransactionItem,
  setTransactionPaid,
  updateTransaction,
} from '@/lib/finance/transactions';
import { transactionBodySchema } from '../schema';

type Context = { params: Promise<{ id: string }> };

// Edição completa: o app sempre manda todos os campos, com a competência
const editSchema = transactionBodySchema.extend({ referenceMonth: monthSchema });
// Pagar / desfazer. Estrito: misturar com campos da edição dá 400
const paidSchema = z.strictObject({ isPaid: z.boolean() });

function internalError(message: string, error: unknown) {
  console.error(message, error);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

/**
 * Edita a transação ou marca como paga/pendente. O body é um dos dois formatos;
 * escolhe pelo `isPaid` em vez de `z.union`, que perderia o campo inválido no erro.
 */
export async function PATCH(request: Request, { params }: Context) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const raw: unknown = await request
    .clone()
    .json()
    .catch(() => undefined);
  const isPaidBody = typeof raw === 'object' && raw !== null && 'isPaid' in raw;

  try {
    if (isPaidBody) {
      const { data: body, errorResponse: bodyError } = await parseJsonBody(
        request,
        paidSchema,
      );
      if (bodyError) return bodyError;

      const updated = await setTransactionPaid(user.id, id, body.isPaid);
      const transaction = updated ? await getTransactionItem(user.id, id) : null;
      if (!transaction) return notFoundResponse();
      return NextResponse.json({ transaction });
    }

    const { data: body, errorResponse: bodyError } = await parseJsonBody(
      request,
      editSchema,
    );
    if (bodyError) return bodyError;

    // Confere antes para não criar a categoria de uma edição que vai dar 404
    if (!(await getTransactionItem(user.id, id))) return notFoundResponse();

    const { referenceMonth, ...data } = body;
    const transaction = await updateTransaction(user.id, id, data, referenceMonth);
    return NextResponse.json({ transaction });
  } catch (error) {
    if (isRecordNotFound(error)) return notFoundResponse();
    return internalError('Erro ao alterar transação (mobile):', error);
  }
}

/** Exclui a transação. Ocorrência de recorrência apagada não é recriada (lastGeneratedMonth). */
export async function DELETE(request: Request, { params }: Context) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    await deleteTransaction(user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isRecordNotFound(error)) return notFoundResponse();
    return internalError('Erro ao excluir transação (mobile):', error);
  }
}
