import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPasswordLogin } from '@/lib/auth';
import { parseJsonBody } from '@/lib/api-validation';
import { getClientIp } from '@/lib/login-rate-limit';
import { createMobileSession } from '@/lib/mobile-auth';
import { getProfile } from '@/lib/finance/profile';

const bodySchema = z.object({
  email: z.string().trim().max(254).pipe(z.email()),
  password: z.string().min(1).max(256),
  deviceName: z.string().trim().max(100).optional(),
  platform: z.enum(['ios', 'android']).optional(),
});

/**
 * Só o nome e o código do erro: a mensagem de um erro do Prisma pode trazer os
 * argumentos da query (o e-mail), e nada do login deve ir para os logs.
 */
function errorSummary(error: unknown) {
  if (!(error instanceof Error)) return { name: typeof error };
  const code =
    'code' in error ? error.code : 'errorCode' in error ? error.errorCode : undefined;
  return { name: error.name, code };
}

/** Login do app por e-mail e senha; devolve os mesmos tokens do login com Google. */
export async function POST(request: Request) {
  const { data, errorResponse } = await parseJsonBody(request, bodySchema);
  if (errorResponse) return errorResponse;

  try {
    const result = await verifyPasswordLogin(
      data.email,
      data.password,
      getClientIp(request.headers),
    );

    if (result.status === 'blocked') {
      return NextResponse.json(
        { error: 'Too many attempts' },
        {
          status: 429,
          headers: { 'Retry-After': String(result.retryAfterSeconds) },
        },
      );
    }
    // Mesma resposta para e-mail inexistente, senha errada e conta sem senha
    if (result.status === 'invalid') {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    const { user } = result;
    const tokens = await createMobileSession(user.id, {
      deviceName: data.deviceName,
      platform: data.platform,
    });
    const profile = await getProfile(user.id, user.email);

    return NextResponse.json({ ...tokens, user: { id: user.id, ...profile } });
  } catch (error) {
    console.error('Erro no login mobile com senha:', errorSummary(error));
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
