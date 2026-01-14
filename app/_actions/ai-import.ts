'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processFileWithAI(base64Data: string, mimeType: string) {
  try {
    const categories = await prisma.category.findMany({
      select: { name: true },
    });
    const categoryList = categories.map((c) => c.name).join(', ');
    const today = new Date().toISOString().split('T')[0];

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
     Você é um especialista em contabilidade brasileira e leitura de extratos bancários (especialmente Itaú).
  Analise o documento e extraia todas as transações.
  
  Hoje é: ${today}.
  Categorias permitidas: [${
    categoryList || 'Alimentação, Transporte, Lazer, Outros'
  }].

  INSTRUÇÕES CRÍTICAS PARA IDENTIFICAÇÃO DE TIPO:
  1. ANALISE O SINAL E O CONTEXTO: 
     - "PAGTO", "PAG", "DEB.AUT", "PIX TRANSF", "PAG BOLETO", "SAQUE" ou valores com sinal (-) são EXPENSE (saídas).
     - "REMUNERAÇÃO", "SALARIO", "PIX RECEBIDO", "TRANSF RECEBIDA" ou valores com sinal (+) são INCOME (entradas).
  2. VALORES: Retorne sempre o valor absoluto (positivo) no campo 'amount'. O tipo será definido pelo campo 'type'.
  3. CATEGORIZAÇÃO: Tente ser inteligente. "HUB LA" ou "MARKETPLACE" costumam ser compras (expense).

  RETORNO:
  - Responda APENAS com um array JSON.
  - Campos: description, amount (number), type ("income" ou "expense"), category, date (YYYY-MM-DD).
    `;

    // Enviamos a imagem junto com o prompt
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const text = result.response.text();
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Erro na IA com arquivo:', error);
    return null;
  }
}

// app/_actions/ai-import.ts

export async function saveTransactions(transactions: any[]) {
  try {
    const TEST_USER_ID = 'user-default-001';

    await Promise.all(
      transactions.map((tx) =>
        prisma.transaction.create({
          data: {
            description: tx.description,
            amount: tx.amount,
            // Certifique-se que o Enum no seu Prisma bate com esses nomes
            type: tx.type === 'income' ? 'DEPOSIT' : 'EXPENSE',
            date: new Date(tx.date),
            category: {
              connect: {
                // CORREÇÃO: Usando a chave composta name_userId
                name_userId: {
                  name: tx.category,
                  userId: TEST_USER_ID,
                },
              },
            },
            user: {
              connectOrCreate: {
                where: { id: TEST_USER_ID },
                create: {
                  id: TEST_USER_ID,
                  email: 'teste@finance.ai',
                  name: 'Usuário de Teste',
                },
              },
            },
          },
        })
      )
    );

    revalidatePath('/Dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro detalhado ao salvar:', error);
    throw new Error('Falha ao salvar transações');
  }
}

export async function getCategories2() {
  const TEST_USER_ID = 'user-default-001'; // O ID que definimos como dono

  return await prisma.category.findMany({
    where: {
      userId: TEST_USER_ID, // <--- FILTRO CRÍTICO AQUI
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}
