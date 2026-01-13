'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Definido o tipo de dados que esperamos do formulário
interface TransactionData {
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
}

export async function createTransaction(data: TransactionData) {
  try {
    await prisma.transaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        type: data.type,

        user: {
          connectOrCreate: {
            where: { email: 'demo@finance.ai' },
            create: {
              email: 'demo@finance.ai',
              name: 'Usuário Demo',
            },
          },
        },

        category: {
          connectOrCreate: {
            where: {
              name_userId: {
                name: data.category,
                userId: 'demo-user-id',
              },
            },
            create: {
              name: data.category,
              type: data.type,
              user: {
                connectOrCreate: {
                  where: { email: 'demo@finance.ai' },
                  create: { email: 'demo@finance.ai' },
                },
              },
            },
          },
        },
      },
    });

    revalidatePath('/Dashboard');
    revalidatePath('/Transactions');

    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar:', error);
    return { sucess: false, error: 'Erro ao salvar transação' };
  }
}
