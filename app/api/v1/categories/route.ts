import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMobileUser } from '@/lib/api-auth';
import {
  moneySchema,
  monthSchema,
  parseJsonBody,
  parseSearchParams,
} from '@/lib/api-validation';
import {
  createCategory,
  getCategoriesWithBudget,
} from '@/lib/finance/categories';
import { categoryColorSchema } from './schema';

const querySchema = z.object({
  month: monthSchema.optional(), // padrão: mês atual
});

function internalError(message: string, error: unknown) {
  console.error(message, error);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

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
    return internalError('Erro ao buscar categorias (mobile):', error);
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: categoryColorSchema,
  budget: moneySchema.nullable().optional(), // ausente ou null = sem limite
});

/**
 * Cria a categoria ou reativa a arquivada com o mesmo nome (a cor e o limite
 * enviados valem para ela). 201 com a categoria no formato de GET /categories
 * e `reactivated`; 409 se já existe uma ativa com o mesmo nome.
 */
export async function POST(request: Request) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { data: body, errorResponse: bodyError } = await parseJsonBody(
    request,
    createSchema,
  );
  if (bodyError) return bodyError;

  try {
    const result = await createCategory(
      user.id,
      body.name,
      body.color,
      body.budget ?? null,
    );
    if (result.status === 'conflict') {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 409 },
      );
    }

    const [category] = await getCategoriesWithBudget(
      user.id,
      undefined,
      result.id,
    );
    return NextResponse.json(
      { category, reactivated: result.status === 'reactivated' },
      { status: 201 },
    );
  } catch (error) {
    return internalError('Erro ao criar categoria (mobile):', error);
  }
}
