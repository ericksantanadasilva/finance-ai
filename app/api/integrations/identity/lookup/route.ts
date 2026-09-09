import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-auth';

const ALLOWED_PROVIDERS = ['telegram', 'discord', 'whatsapp', 'web'] as const;
type Provider = (typeof ALLOWED_PROVIDERS)[number];

interface LookupRequestBody {
  provider: Provider;
  providerUserId: string;
}

export async function POST(request: Request) {
  // 1. Validação de segurança via x-api-key (n8n)
  const authError = validateApiKey(request);
  if (authError) {
    return authError;
  }

  try {
    // 2. Parse e validação do payload
    const body: Partial<LookupRequestBody> = await request.json().catch(() => ({}));
    const { provider, providerUserId } = body;

    if (!provider || !providerUserId) {
      return NextResponse.json(
        { error: 'provider and providerUserId are required' },
        { status: 400 },
      );
    }

    if (!ALLOWED_PROVIDERS.includes(provider as Provider)) {
      return NextResponse.json(
        {
          error: `Invalid provider. Must be one of: ${ALLOWED_PROVIDERS.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // 3. Consulta no banco de dados via Prisma
    const identity = await prisma.externalIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId: String(providerUserId),
        },
      },
    });

    if (!identity) {
      return NextResponse.json(
        { error: 'Identity not found' },
        { status: 404 },
      );
    }

    // 4. Busca as categorias cadastradas para este usuário
    const categories = await prisma.category.findMany({
      where: { userId: identity.userId },
      select: {
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      {
        ...identity,
        availableCategories: categories.map(c => c.name).join(', ')
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Erro na consulta de identidade externa:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
