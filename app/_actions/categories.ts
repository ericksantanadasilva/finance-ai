'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function getCategories() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return await prisma.category.findMany({
    where: {
      userId: user.id, // Filtra para retornar apenas as categorias do dono
    },
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(name: string, color: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Não autorizado');

  await prisma.category.create({
    data: {
      name,
      color,
      type: 'expense',
      userId: user.id, // Vincula a nova categoria ao ID real do Supabase
    },
  });

  revalidatePath('/Categories');
  revalidatePath('/import');
  revalidatePath('/Dashboard'); // Importante para atualizar o gráfico de fatias
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Não autorizado');

  // Onde: garantimos que o usuário só pode deletar o que pertence a ele
  await prisma.category.delete({
    where: {
      id,
      userId: user.id, // Camada extra de segurança
    },
  });

  revalidatePath('/Categories');
  revalidatePath('/Dashboard');
}
