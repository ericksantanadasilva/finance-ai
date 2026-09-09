import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { validateUserSession } from '@/lib/api-auth';

const TOKEN_EXPIRATION_MINUTES = 15;
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Caracteres legíveis sem confusão (ex: sem 0/O e 1/I)

function generateShortToken(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }
  return result;
}

export async function POST(request: Request) {
  // 1. Validação da sessão de usuário ativo via Supabase (suporta Cookie no Web e Bearer no Mobile)
  const { user, errorResponse } = await validateUserSession(request);
  if (errorResponse) {
    return errorResponse;
  }

  const userId = user.id;

  try {
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000);

    // Opcional: remove tokens antigos/expirados deste usuário antes de gerar um novo
    await prisma.linkToken
      .deleteMany({
        where: {
          userId,
        },
      })
      .catch(() => {});

    // Gera token único e salva no banco de dados
    let token = generateShortToken(6);
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const createdToken = await prisma.linkToken.create({
          data: {
            token,
            userId,
            expiresAt,
          },
        });

        return NextResponse.json(
          {
            token: createdToken.token,
            expiresAt: createdToken.expiresAt.toISOString(),
          },
          { status: 201 },
        );
      } catch (err: any) {
        // Trata eventual colisão de chave primária no token
        if (err.code === 'P2002') {
          token = generateShortToken(6);
          attempts++;
          continue;
        }
        throw err;
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate unique token. Please try again.' },
      { status: 500 },
    );
  } catch (error) {
    console.error('Erro ao gerar link token:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
