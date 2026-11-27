import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMobileUser } from '@/lib/api-auth';
import {
  moneySchema,
  monthSchema,
  notFoundResponse,
  parseJsonBody,
  parseSearchParams,
} from '@/lib/api-validation';
import {
  archiveCategory,
  getCategoriesWithBudget,
  updateCategory,
} from '@/lib/finance/categories';
import { categoryColorSchema } from '../schema';

type Context = { params: Promise<{ id: string }> };

// Campo ausente fica como está. budget null remove o limite; 0 é rejeitado
// (moneySchema é > 0) para haver um só jeito de remover
const bodySchema = z
  .object({
    budget: moneySchema.nullable().optional(),
    color: categoryColorSchema.optional(),
  })
  .refine((b) => b.budget !== undefined || b.color !== undefined, {
    message: 'Informe budget e/ou color',
  });
const querySchema = z.object({
  month: monthSchema.optional(), // mês do gasto devolvido; padrão: mês atual
});

function internalError(message: string, error: unknown) {
  console.error(message, error);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

/**
 * Altera o limite mensal e/ou a cor. Responde com a categoria no formato de
 * GET /categories; 404 se ela não existir, for de outro usuário ou estiver arquivada.
 */
export async function PATCH(request: Request, { params }: Context) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { data: query, errorResponse: queryError } = parseSearchParams(
    request,
    querySchema,
  );
  if (queryError) return queryError;

  const { data: body, errorResponse: bodyError } = await parseJsonBody(
    request,
    bodySchema,
  );
  if (bodyError) return bodyError;

  const { id } = await params;
  try {
    const updated = await updateCategory(user.id, id, body);
    if (!updated) return notFoundResponse();

    const [category] = await getCategoriesWithBudget(user.id, query.month, id);
    if (!category) return notFoundResponse();
    return NextResponse.json({ category });
  } catch (error) {
    return internalError('Erro ao alterar categoria (mobile):', error);
  }
}

/**
 * Arquiva a categoria: as transações continuam com ela e as recorrências
 * ativas continuam gerando com ela. 204; 404 se não existir ou já estiver arquivada.
 */
export async function DELETE(request: Request, { params }: Context) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    const archived = await archiveCategory(user.id, id);
    if (!archived) return notFoundResponse();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return internalError('Erro ao arquivar categoria (mobile):', error);
  }
}
