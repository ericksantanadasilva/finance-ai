import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJsonBody } from '@/lib/api-validation';
import { revokeMobileSession } from '@/lib/mobile-auth';

const bodySchema = z.object({
  refreshToken: z.string().min(1),
});

/**
 * Logout do aparelho. Responde 204 mesmo se o token já não valer, para o app
 * poder limpar a sessão local sem tratar erro.
 */
export async function POST(request: Request) {
  const { data, errorResponse } = await parseJsonBody(request, bodySchema);
  if (errorResponse) return errorResponse;

  try {
    await revokeMobileSession(data.refreshToken);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro no logout mobile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
