import { NextResponse } from 'next/server';
import { requireMobileUser } from '@/lib/api-auth';
import { generateForUser } from '@/lib/finance/recurring';
import { getDashboardTotals } from '@/lib/finance/transactions';

/**
 * Totais por mês de competência, tipo, situação (isPaid) e categoria (os mesmos do Dashboard web).
 * Como a página web, gera antes as recorrências devidas.
 */
export async function GET(request: Request) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  try {
    await generateForUser(user.id);
    const totals = await getDashboardTotals(user.id);
    return NextResponse.json({ totals });
  } catch (error) {
    console.error('Erro ao buscar dashboard (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
