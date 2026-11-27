import { NextResponse } from 'next/server';
import { requireMobileUser } from '@/lib/api-auth';
import { parseJsonBody } from '@/lib/api-validation';
import {
  createRecurringRule,
  generateForUser,
  getRecurringRuleItem,
  getRecurringRules,
} from '@/lib/finance/recurring';
import { recurringBodySchema } from './schema';

/** Regras recorrentes. Como a página web, gera antes as ocorrências devidas. */
export async function GET(request: Request) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  try {
    await generateForUser(user.id);
    const rules = await getRecurringRules(user.id);
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Erro ao buscar recorrências (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

/** Cria a regra e já gera as ocorrências do mês de início até o atual. */
export async function POST(request: Request) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { data: body, errorResponse: bodyError } = await parseJsonBody(
    request,
    recurringBodySchema,
  );
  if (bodyError) return bodyError;

  try {
    const result = await createRecurringRule(user.id, {
      ...body,
      category: body.category ?? '',
    });
    // Segunda barreira: a validação do service, caso ela fique mais rígida que o Zod
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const rule = await getRecurringRuleItem(user.id, result.id);
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar recorrência (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
