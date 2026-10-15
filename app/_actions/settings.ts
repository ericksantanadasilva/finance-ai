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

/**
 * 3. UPLOAD DE IMAGEM DE PERFIL
 * Recebe um FormData contendo o arquivo
 */
export async function updateProfileImage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Não autorizado');

  const file = formData.get('file') as File;
  if (!file) return { success: false, error: 'Nenhum arquivo enviado' };

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // 1. Upload para o Bucket 'avatars' (Crie este bucket no Supabase Storage como PUBLIC)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 2. Gerar URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath);

    // 3. Salvar URL no Prisma
    await prisma.user.update({
      where: { id: user.id },
      data: { imageUrl: publicUrl },
    });

    revalidatePath('/settings');
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}
