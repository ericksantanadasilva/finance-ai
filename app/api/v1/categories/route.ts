import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMobileUser } from '@/lib/api-auth';
import { monthSchema, parseSearchParams } from '@/lib/api-validation';
import { getCategoriesWithBudget } from '@/lib/finance/categories';

const querySchema = z.object({
  month: monthSchema.optional(), // padrão: mês atual
});

/** Categorias com o limite mensal e quanto já foi gasto no mês de competência. */
export async function GET(request: Request) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { data: query, errorResponse: queryError } = parseSearchParams(
    request,
    querySchema,
  );
  if (queryError) return queryError;

  try {
    const categories = await getCategoriesWithBudget(user.id, query.month);
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Erro ao buscar categorias (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
