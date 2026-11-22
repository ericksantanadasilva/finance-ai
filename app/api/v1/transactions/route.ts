import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMobileUser } from '@/lib/api-auth';
import {
  dateOnlySchema,
  moneySchema,
  monthSchema,
  parseJsonBody,
  parseSearchParams,
} from '@/lib/api-validation';
import { generateForUser } from '@/lib/finance/recurring';
import {
  createTransaction,
  getTransactionsPage,
} from '@/lib/finance/transactions';
import { APP_TIME_ZONE, currentMonthISO } from '@/app/utils/dates';

const querySchema = z.object({
  q: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  // Igual à tela web: sem mês = mês atual; "all" = todos os meses
  month: z
    .union([z.string().regex(/^\d{4}-\d{2}$/), z.literal('all')])
    .optional(),
  type: z.enum(['income', 'expense']).optional(),
  status: z.enum(['paid', 'pending']).optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  sort: z.enum(['date_desc', 'date_asc', 'amount_desc', 'amount_asc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

/** Lista paginada com filtros, totais do conjunto e opções de categoria/mês. */
export async function GET(request: Request) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { data: query, errorResponse: queryError } = parseSearchParams(
    request,
    querySchema,
  );
  if (queryError) return queryError;

  try {
    await generateForUser(user.id);

    const month = query.month ?? currentMonthISO(APP_TIME_ZONE);
    const page = await getTransactionsPage(user.id, {
      ...query,
      month: month === 'all' ? undefined : month,
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('Erro ao buscar transações (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

const createSchema = z.object({
  description: z.string().trim().min(1).max(200),
  amount: moneySchema,
  date: dateOnlySchema, // data da compra
  type: z.enum(['income', 'expense']),
  category: z.string().trim().min(1).max(50), // nome; criada se não existir
  referenceMonth: monthSchema.optional(), // competência; padrão: mês atual
});

/** Lança a transação. Responde com o item (formato da listagem) e o alerta de orçamento. */
export async function POST(request: Request) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { data: body, errorResponse: bodyError } = await parseJsonBody(
    request,
    createSchema,
  );
  if (bodyError) return bodyError;

  try {
    const { referenceMonth, ...data } = body;
    const { transaction, budgetAlert } = await createTransaction(
      user.id,
      data,
      referenceMonth,
    );
    return NextResponse.json({ transaction, budgetAlert }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar transação (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
