'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createTransaction(data: any) {
  try {
    // 1. Garante o usuário demo
    const user = await prisma.user.upsert({
      where: { email: 'demo@finance.ai' },
      update: {},
      create: {
        email: 'demo@finance.ai',
        name: 'Usuário Demo',
      },
    });

    // 2. BUSCA ou CRIA a categoria PRIMEIRO (Garante que temos um ID)
    const category = await prisma.category.upsert({
      where: {
        name_userId: {
          name: data.category,
          userId: user.id,
        },
      },
      update: {}, // Se já existir, não muda nada
      create: {
        name: data.category,
        type: data.type,
        userId: user.id,
      },
    });

    // 3. CRIA a transação usando o categoryId (ID que acabamos de obter)
    // Isso evita o erro de "Unknown argument category"
    await prisma.transaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        type: data.type,
        userId: user.id,
        categoryId: category.id, // Passamos o ID direto aqui
      },
    });

    revalidatePath('/Dashboard'); // Atualiza a página do Dashboard após criar
    return { success: true };
  } catch (error) {
    console.error('ERRO NO BANCO:', error);
    return { success: false };
  }
}

export async function getTransactions() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        date: 'desc',
      },
      take: 10, //pega só as 10 últimas pra não pesar
      include: {
        category: true, // traz os dados da categoria junto (cor, nome, etc)
      },
    });

    // Precisamos converter Decimal e Date para string/number simples
    // para não dar erro de serialização no React
    return transactions.map((t) => ({
      ...t,
      amount: t.amount.toNumber(), // converte Decimal para number
      date: t.date.toISOString(), // converte Date para string ISO
    }));
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }
}
