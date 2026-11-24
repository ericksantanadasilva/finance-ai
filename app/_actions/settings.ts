'use server';

import { getSessionUser, requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import * as profileService from '@/lib/finance/profile';

/**
 * 1. BUSCAR PERFIL
 * Busca na tabela User usando o ID da sessão
 */
export async function getUserProfile() {
  const authUser = await getSessionUser();

  if (!authUser) return null;

  return profileService.getProfile(authUser.id, authUser.email);
}

/**
 * 2. ATUALIZAR NOME
 */
export async function updateProfile(data: { name: string }) {
  const user = await requireUser();

  try {
    await profileService.updateProfileName(user.id, data.name);

    revalidatePath('/Settings');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
