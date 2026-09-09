import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-auth';

interface LinkRequestBody {
  token: string;
  provider: string;
  providerUserId: string;
}

export async function POST(request: Request) {
  // 1. Proteção por x-api-key (n8n)
  const authError = validateApiKey(request);
  if (authError) {
    return authError;
  }

  try {
    const body: Partial<LinkRequestBody> = await request.json().catch(() => ({}));
    const { token, provider, providerUserId } = body;

    if (!token || !provider || !providerUserId) {
      return NextResponse.json(
        { error: 'token, provider and providerUserId are required' },
        { status: 400 },
      );
    }

    const normalizedToken = token.trim().toUpperCase();
    const normalizedProvider = provider.trim().toLowerCase();

    // 2. Valida se o token existe na tabela link_tokens
    const linkToken = await prisma.linkToken.findUnique({
      where: { token: normalizedToken },
    });

    if (!linkToken) {
      return NextResponse.json(
        { error: 'Invalid or non-existent link token' },
        { status: 400 },
      );
    }

    // 3. Valida expiração do token
    if (new Date() > linkToken.expiresAt) {
      // Remove o token expirado para manter o banco higienizado
      await prisma.linkToken
        .delete({ where: { token: normalizedToken } })
        .catch(() => {});

      return NextResponse.json(
        { error: 'Link token has expired' },
        { status: 400 },
      );
    }

    // 4. Executa em transaction atômica no Prisma: upsert da identidade e deleção do token
    const result = await prisma.$transaction(async (tx) => {
      await tx.externalIdentity.upsert({
        where: {
          provider_providerUserId: {
            provider: normalizedProvider,
            providerUserId: String(providerUserId),
          },
        },
        create: {
          provider: normalizedProvider,
          providerUserId: String(providerUserId),
          userId: linkToken.userId,
        },
        update: {
          userId: linkToken.userId,
        },
      });

      await tx.linkToken.delete({
        where: { token: normalizedToken },
      });

      return { userId: linkToken.userId };
    });

    return NextResponse.json(
      { success: true, userId: result.userId },
      { status: 200 },
    );
  } catch (error) {
    console.error('Erro ao vincular identidade externa:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
