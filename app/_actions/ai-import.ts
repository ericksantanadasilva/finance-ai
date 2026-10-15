'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ensureDbUser } from '@/lib/ensure-user';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processFileWithAI(base64Data: string, mimeType: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      select: { name: true },
    });
    const categoryList = categories.map((c) => c.name).join(', ');
    const today = new Date().toISOString().split('T')[0];

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Você é um extrator de dados de alta precisão especializado em faturas de cartão de crédito Itaú.
      Sua missão é converter cada linha de gasto em um objeto JSON, sem alterar os nomes.

      Hoje é: ${today}.
      Categorias permitidas: [${categoryList || 'Alimentação, Transporte, Lazer, Outros'}].

      REGRAS DE OURO (PARA NÃO INVENTAR E NÃO ESQUECER):
      1. FIDELIDADE TOTAL AO TEXTO: No campo "description", extraia o texto EXATAMENTE como aparece na coluna "ESTABELECIMENTO" ou "PRODUTOS/SERVIÇOS". Não resuma, não remova códigos e não invente nomes (Ex: se está "MP *AGUIACAR", mantenha "MP *AGUIACAR").
      2. CONSIDERE TODAS AS PÁGINAS: O documento possui várias páginas. Você deve buscar transações até o final, incluindo os blocos "Lançamentos: compras e saques", "Lançamentos: produtos e serviços" e "Lançamentos: Pix".
      3. REGRA DE LINHA ÚNICA: 1 linha de transação com data e valor no PDF = 1 objeto no JSON. Nunca agrupe valores.
      4. IGNORE: Apenas linhas de cabeçalho, rodapé, "Total da fatura", "Pagamento efetuado", "Saldo anterior" e resumos de "Lançamentos no cartão (final ...)".

      PRECISÃO DE VALORES E TIPOS:
      - VALOR: Use o valor numérico exato com centavos (ex: 120,12 -> 120.12).
      - TIPO:
        * Se o valor for uma compra ou cobrança de serviço -> "expense".
        * Se o valor tiver um sinal de menos (-) ao lado ou for identificado como "Estorno" ou "Crédito de" -> "income".

      CATEGORIZAÇÃO LÓGICA:
      - NUNCA use "Dinheiro Extra" para transações do tipo "expense".
      - Se o estabelecimento for Shopee, Amazon, Google, Apple, Uber, Ifood ou nomes de serviços, use a categoria de consumo mais lógica dentro das permitidas.
      - Na dúvida para despesas, use "Outros" ou "Cartão de Crédito".

      RETORNO:
      - Responda APENAS com o array JSON puro.
      - Formato: [{"description": string, "amount": number, "type": "income" | "expense", "category": string, "date": "YYYY-MM-DD"}]
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

/**
 * Salva as transações utilizando uma data de referência para competência.
 * @param transactions - Array de transações extraídas pela IA.
 * @param referenceMonth - String no formato "YYYY-MM" vinda do seletor do usuário.
 */

export async function saveTransactions(
  transactions: any[],
  referenceMonth: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const userId = user.id;
    await ensureDbUser(user);

    const [year, month] = referenceMonth.split('-').map(Number);
    const referenceDate = new Date(year, month - 1, 1, 12, 0, 0);

    // Evita duplicatas ao reimportar a mesma fatura (mesma descrição, valor, data e competência)
    const existing = await prisma.transaction.findMany({
      where: { userId, referenceDate },
      select: { description: true, amount: true, date: true },
    });
    const makeKey = (d: string, a: number, dt: Date) =>
      `${d}|${Number(a).toFixed(2)}|${dt.toISOString().slice(0, 10)}`;
    const seen = new Set(
      existing.map((e) => makeKey(e.description, Number(e.amount), e.date)),
    );

    const toSave = transactions.filter((tx) => {
      const key = makeKey(tx.description, tx.amount, new Date(tx.date));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Uma única transação do banco: ou salva tudo, ou nada
    await prisma.$transaction(async (tx) => {
      const categoryIds = new Map<string, string>();
      for (const name of new Set(toSave.map((t) => t.category as string))) {
        const category = await tx.category.upsert({
          where: { name_userId: { name, userId } },
          update: {},
          create: { name, userId, color: '#71717a', type: 'expense' },
        });
        categoryIds.set(name, category.id);
      }

      await tx.transaction.createMany({
        data: toSave.map((t) => ({
          description: t.description,
          amount: t.amount,
          type: t.type === 'income' ? 'income' : 'expense',
          date: new Date(t.date), // Data real da compra (Extrato)
          referenceDate, // Data de competência (Dashboard)
          aiGenerated: true,
          categoryId: categoryIds.get(t.category),
          userId,
        })),
      });
    });

    revalidatePath('/Dashboard');
    revalidatePath('/Transactions');
    return {
      success: true,
      imported: toSave.length,
      skipped: transactions.length - toSave.length,
    };
  } catch (error) {
    console.error('Erro detalhado ao salvar:', error);
    throw new Error('Falha ao salvar transações');
  }
}

export async function getCategories2() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return await prisma.category.findMany({
    where: {
      userId: user.id,
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
