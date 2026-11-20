import { NextResponse } from 'next/server';
import { requireMobileUser } from '@/lib/api-auth';
import { generateForUser, getRecurringRules } from '@/lib/finance/recurring';

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
