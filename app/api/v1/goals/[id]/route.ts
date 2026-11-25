import { NextResponse } from 'next/server';
import { requireMobileUser } from '@/lib/api-auth';
import {
  isRecordNotFound,
  notFoundResponse,
  parseJsonBody,
} from '@/lib/api-validation';
import { deleteGoal, patchGoal } from '@/lib/finance/goals';
import { goalPatchSchema } from '../schema';

type Context = { params: Promise<{ id: string }> };

function internalError(message: string, error: unknown) {
  console.error(message, error);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

/** Altera só os campos enviados. Responde com a meta no formato de GET /goals. */
export async function PATCH(request: Request, { params }: Context) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { data: body, errorResponse: bodyError } = await parseJsonBody(
    request,
    goalPatchSchema,
  );
  if (bodyError) return bodyError;

  const { id } = await params;
  try {
    const goal = await patchGoal(user.id, id, body);
    return NextResponse.json({ goal });
  } catch (error) {
    if (isRecordNotFound(error)) return notFoundResponse();
    return internalError('Erro ao alterar meta (mobile):', error);
  }
}

/** Exclui a meta. A confirmação fica no app: não há como restaurar. */
export async function DELETE(request: Request, { params }: Context) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    await deleteGoal(user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isRecordNotFound(error)) return notFoundResponse();
    return internalError('Erro ao excluir meta (mobile):', error);
  }
}
