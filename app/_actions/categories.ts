'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(name: string, color: string) {
  const TEST_USER_ID = 'user-default-001';

  await prisma.category.create({
    data: {
      name,
      color,
      type: 'expense',
      user: {
        // 2. O truque: connectOrCreate garante que o usuário exista
        connectOrCreate: {
          where: { id: TEST_USER_ID },
          create: {
            id: TEST_USER_ID,
            email: 'teste@finance.ai', // O campo email costuma ser obrigatório no model User
            name: 'Usuário de Teste',
          },
        },
      },
    },
  });

  revalidatePath('/Categories');
  revalidatePath('/import');
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath('/Categories');
}
