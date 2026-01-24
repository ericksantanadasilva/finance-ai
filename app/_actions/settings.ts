'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    name:
      user.user_metadata?.full_name || user.user_metadata?.name || 'Usuário',
    email: user.email,
  };
}

export async function updateProfile(data: { name: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Não autorizado');

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: data.name },
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
