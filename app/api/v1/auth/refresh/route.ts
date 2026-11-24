import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJsonBody } from '@/lib/api-validation';
import { rotateMobileSession } from '@/lib/mobile-auth';

const bodySchema = z.object({
  refreshToken: z.string().min(1),
});

/** Troca o refresh token por um par novo; o antigo deixa de valer. */
export async function POST(request: Request) {
  const { data, errorResponse } = await parseJsonBody(request, bodySchema);
  if (errorResponse) return errorResponse;

  try {
    const tokens = await rotateMobileSession(data.refreshToken);
    if (!tokens) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 },
      );
    }

    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Erro ao renovar sessão mobile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
