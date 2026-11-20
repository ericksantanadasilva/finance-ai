// Perfil do usuário, usado pelas server actions e pelas rotas da API.
// Sem 'use server': o userId vem de quem chama, depois de autenticar.
import { prisma } from '@/lib/prisma';

/**
 * Perfil para exibição. `fallbackEmail` (o e-mail da sessão) é usado se o
 * registro não tiver e-mail.
 */
export async function getProfile(userId: string, fallbackEmail?: string | null) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, imageUrl: true },
  });

  return {
    name: dbUser?.name || 'Usuário',
    email: dbUser?.email || fallbackEmail || undefined,
    image: dbUser?.imageUrl || null,
  };
}

export async function updateProfileName(userId: string, name: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { name },
  });
}
