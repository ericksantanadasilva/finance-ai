import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMobileUser } from '@/lib/api-auth';
import { parseJsonBody } from '@/lib/api-validation';
import { registerPushDevice } from '@/lib/push';

const bodySchema = z.object({
  expoPushToken: z
    .string()
    .max(200)
    .regex(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/),
  platform: z.enum(['android', 'ios']),
});

/**
 * Registra o aparelho para push, ligado à sessão do token. O app chama a cada
 * abertura com sessão e permissão: renova o lastSeenAt e cobre a troca do token.
 */
export async function POST(request: Request) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { data: body, errorResponse: bodyError } = await parseJsonBody(
    request,
    bodySchema,
  );
  if (bodyError) return bodyError;

  try {
    const device = await registerPushDevice(
      user.id,
      user.sessionId,
      body.expoPushToken,
      body.platform,
    );
    return NextResponse.json({ device });
  } catch (error) {
    console.error('Erro ao registrar aparelho (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
