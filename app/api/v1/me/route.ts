import { NextResponse } from 'next/server';
import { requireMobileUser } from '@/lib/api-auth';
import { getProfile } from '@/lib/finance/profile';

/** Perfil do usuário do app mobile. */
export async function GET(request: Request) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  try {
    const profile = await getProfile(user.id);
    return NextResponse.json({ id: user.id, ...profile });
  } catch (error) {
    console.error('Erro ao buscar perfil (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
