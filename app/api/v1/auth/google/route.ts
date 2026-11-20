import { NextResponse } from 'next/server';
import { z } from 'zod';
import { linkGoogleAccount } from '@/lib/auth';
import { parseJsonBody } from '@/lib/api-validation';
import { createMobileSession, verifyGoogleIdToken } from '@/lib/mobile-auth';
import { getProfile } from '@/lib/finance/profile';

const bodySchema = z.object({
  idToken: z.string().min(1),
  deviceName: z.string().trim().max(100).optional(),
  platform: z.enum(['ios', 'android']).optional(),
});

/** Login do app: troca o ID token do Google (login nativo) pelos tokens da API. */
export async function POST(request: Request) {
  const { data, errorResponse } = await parseJsonBody(request, bodySchema);
  if (errorResponse) return errorResponse;

  try {
    const identity = await verifyGoogleIdToken(data.idToken);
    if (!identity) {
      return NextResponse.json(
        { error: 'Invalid Google ID token' },
        { status: 401 },
      );
    }

    // Mesma regra do login web: cada conta Google cai sempre no mesmo usuário
    const userId = await linkGoogleAccount(identity);
    if (!userId) {
      return NextResponse.json({ error: 'Login not allowed' }, { status: 403 });
    }

    const tokens = await createMobileSession(userId, {
      deviceName: data.deviceName,
      platform: data.platform,
    });
    const profile = await getProfile(userId, identity.email);

    return NextResponse.json({ ...tokens, user: { id: userId, ...profile } });
  } catch (error) {
    console.error('Erro no login mobile com Google:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
