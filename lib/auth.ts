import bcrypt from 'bcryptjs';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider, { type GoogleProfile } from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

// Sem isso a senha ficaria aberta a tentativas ilimitadas (o Supabase limitava antes).
// Em memória porque o app roda em um único container.
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function isLoginBlocked(email: string) {
  const attempt = loginAttempts.get(email);
  if (!attempt) return false;
  if (attempt.resetAt <= Date.now()) {
    loginAttempts.delete(email);
    return false;
  }
  return attempt.count >= MAX_LOGIN_ATTEMPTS;
}

function registerFailedLogin(email: string) {
  const attempt = loginAttempts.get(email);
  if (attempt) attempt.count += 1;
  else
    loginAttempts.set(email, {
      count: 1,
      resetAt: Date.now() + LOGIN_WINDOW_MS,
    });
}

/** Campos do perfil Google usados no login (vêm do OAuth web ou do ID token do mobile). */
export type GoogleIdentity = Pick<
  GoogleProfile,
  'sub' | 'email' | 'email_verified' | 'name'
>;

/**
 * Encontra o usuário da conta Google pelo googleId ou pelo e-mail (conta existente
 * ainda não vinculada) e cria um novo se não houver. Retorna o id do usuário, ou
 * null se recusar o login. Usado pelo login web e pelo login do app mobile.
 */
export async function linkGoogleAccount(
  profile: GoogleIdentity,
): Promise<string | null> {
  if (!profile.email_verified || !profile.email) return null;

  const byGoogleId = await prisma.user.findUnique({
    where: { googleId: profile.sub },
    select: { id: true },
  });
  if (byGoogleId) return byGoogleId.id;

  const email = profile.email.toLowerCase();
  const byEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true, googleId: true },
  });

  if (!byEmail) {
    const created = await prisma.user.create({
      data: { email, name: profile.name || 'Usuário', googleId: profile.sub },
      select: { id: true },
    });
    return created.id;
  }

  // E-mail já vinculado a outra conta Google (ex: endereço reaproveitado)
  if (byEmail.googleId) return null;

  await prisma.user.update({
    where: { id: byEmail.id },
    data: { googleId: profile.sub },
  });
  return byEmail.id;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/', error: '/' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password || isLoginBlocked(email)) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, passwordHash: true },
        });

        const valid =
          !!user?.passwordHash &&
          (await bcrypt.compare(password, user.passwordHash));
        if (!valid) {
          registerFailedLogin(email);
          return null;
        }

        loginAttempts.delete(email);
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return true;
      return !!(await linkGoogleAccount(profile as GoogleProfile));
    },
    async jwt({ token, account }) {
      // O sub padrão seria o ID do Google; a sessão precisa do ID do usuário no banco
      if (account?.provider === 'google') {
        const user = await prisma.user.findUniqueOrThrow({
          where: { googleId: account.providerAccountId },
          select: { id: true },
        });
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
};

/** Usuário da sessão atual ou null. */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/** Usuário da sessão atual; lança erro se não houver sessão. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autorizado');
  return user;
}
