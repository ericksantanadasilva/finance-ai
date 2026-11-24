// Autenticação do app mobile (ver docs/PLANO_API_MOBILE.md).
// O app troca o ID token do Google por um par de tokens próprios:
// - access token: JWT curto (HS256, MOBILE_JWT_SECRET) enviado como Bearer;
// - refresh token: valor aleatório; no banco fica só o hash (MobileSession).
import crypto from 'crypto';
import { createRemoteJWKSet, errors, jwtVerify, SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';
import type { GoogleIdentity } from '@/lib/auth';

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1h
const REFRESH_TOKEN_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 dias desde o último uso

// Separam os tokens do mobile de qualquer outro JWT assinado com o mesmo algoritmo
const TOKEN_ISSUER = 'financeiro-api';
const TOKEN_AUDIENCE = 'financeiro-mobile';

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

/** Client IDs aceitos no `aud`: o web (usado como webClientId no app) e os de Android/iOS. */
function googleAudiences() {
  return [
    process.env.GOOGLE_CLIENT_ID,
    ...(process.env.GOOGLE_MOBILE_CLIENT_IDS ?? '').split(','),
  ]
    .map((id) => id?.trim())
    .filter((id): id is string => !!id);
}

function accessTokenSecret() {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('MOBILE_JWT_SECRET ausente ou com menos de 32 caracteres');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Valida o ID token do Google (assinatura, emissor, audiência e validade).
 * Retorna null se o token for inválido; falhas de rede ou de configuração lançam erro.
 */
export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleIdentity | null> {
  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: GOOGLE_ISSUERS,
      audience: googleAudiences(),
      algorithms: ['RS256'],
    });

    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      // Tokens antigos do Google mandam "true" como texto
      email_verified:
        payload.email_verified === true || payload.email_verified === 'true',
      name: typeof payload.name === 'string' ? payload.name : '',
    };
  } catch (error) {
    // Token malformado, expirado, de outro cliente etc. A falha ao buscar as
    // chaves do Google (JWKSTimeout) não é culpa do token: deixa subir.
    if (error instanceof errors.JOSEError && !(error instanceof errors.JWKSTimeout)) {
      return null;
    }
    throw error;
  }
}

function hashRefreshToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function newRefreshToken() {
  return crypto.randomBytes(32).toString('base64url');
}

async function signAccessToken(userId: string, sessionId: string) {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(accessTokenSecret());
}

export type MobileTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // segundos até o access token expirar
};

export type MobileDevice = {
  deviceName?: string | null;
  platform?: string | null;
};

/** Cria a sessão de um aparelho e devolve o primeiro par de tokens. */
export async function createMobileSession(
  userId: string,
  device: MobileDevice = {},
): Promise<MobileTokens> {
  const refreshToken = newRefreshToken();

  const session = await prisma.mobileSession.create({
    data: {
      userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      deviceName: device.deviceName?.slice(0, 100) || null,
      platform: device.platform?.slice(0, 20) || null,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
    select: { id: true },
  });

  return {
    accessToken: await signAccessToken(userId, session.id),
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

/**
 * Troca um refresh token válido por um par novo (o antigo deixa de valer).
 * Retorna null se o token não existir, tiver sido revogado, expirado ou já usado.
 */
export async function rotateMobileSession(
  refreshToken: string,
): Promise<MobileTokens | null> {
  const oldHash = hashRefreshToken(refreshToken);
  const session = await prisma.mobileSession.findUnique({
    where: { refreshTokenHash: oldHash },
    select: { id: true, userId: true, revokedAt: true, expiresAt: true },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  const nextToken = newRefreshToken();
  // O filtro pelo hash antigo impede que duas renovações simultâneas com o
  // mesmo token gerem dois pares válidos: só a primeira altera a linha.
  const updated = await prisma.mobileSession.updateMany({
    where: { id: session.id, refreshTokenHash: oldHash, revokedAt: null },
    data: {
      refreshTokenHash: hashRefreshToken(nextToken),
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  if (updated.count === 0) return null;

  return {
    accessToken: await signAccessToken(session.userId, session.id),
    refreshToken: nextToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

/** Logout do aparelho: revoga a sessão do refresh token (sem erro se já não valer). */
export async function revokeMobileSession(refreshToken: string) {
  const session = await prisma.mobileSession.findUnique({
    where: { refreshTokenHash: hashRefreshToken(refreshToken) },
    select: { id: true },
  });
  if (!session) return;

  // Os aparelhos da sessão deixam de receber push junto com o logout
  const now = new Date();
  await prisma.$transaction([
    prisma.mobileSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: now },
    }),
    prisma.pushDevice.updateMany({
      where: { mobileSessionId: session.id, disabledAt: null },
      data: { disabledAt: now },
    }),
  ]);
}

/**
 * Valida o access token e confere no banco se a sessão continua ativa
 * (revogar um aparelho vale na hora, sem esperar o token expirar).
 * Retorna o id do usuário e o da sessão, ou null.
 */
export async function authenticateAccessToken(token: string) {
  let userId: string;
  let sessionId: string;
  try {
    const { payload } = await jwtVerify(token, accessTokenSecret(), {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      algorithms: ['HS256'],
    });
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
      return null;
    }
    userId = payload.sub;
    sessionId = payload.sid;
  } catch (error) {
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }

  const session = await prisma.mobileSession.findFirst({
    where: {
      id: sessionId,
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  return session ? { userId, sessionId } : null;
}
