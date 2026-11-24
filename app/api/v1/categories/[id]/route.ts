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
  getCategoriesWithBudget,
  setCategoryBudget,
} from '@/lib/finance/categories';

type Context = { params: Promise<{ id: string }> };

// null remove o limite. 0 é rejeitado (moneySchema é > 0) para haver um só jeito de remover
const bodySchema = z.object({ budget: moneySchema.nullable() });
const querySchema = z.object({
  month: monthSchema.optional(), // mês do gasto devolvido; padrão: mês atual
});

/** Define ou remove o limite mensal. Responde com a categoria no formato de GET /categories. */
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
    const updated = await setCategoryBudget(user.id, id, body.budget);
    if (!updated) return notFoundResponse();

    const [category] = await getCategoriesWithBudget(user.id, query.month, id);
    if (!category) return notFoundResponse();
    return NextResponse.json({ category });
  } catch (error) {
    console.error('Erro ao definir limite da categoria (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
