'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { ensureDbUser } from '@/lib/ensure-user';
import { revalidatePath } from 'next/cache';

/**
 * 1. BUSCAR PERFIL
 * Agora busca na tabela PUBLIC.USER usando o ID da sessão
 */
export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  // Buscamos no Prisma para pegar o que está na tabela pública
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      name: true,
      email: true,
      imageUrl: true, // Certifique-se que esse campo existe no seu schema.prisma
    },
  });

  return {
    name: dbUser?.name || 'Usuário',
    email: dbUser?.email || authUser.email,
    image: dbUser?.imageUrl || null,
  };
}

/**
 * 2. ATUALIZAR NOME
 */
export async function updateProfile(data: { name: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Não autorizado');

  try {
    await ensureDbUser(user);
    await prisma.user.update({
      where: { id: user.id },
      data: { name: data.name },
    });

    revalidatePath('/Settings');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
