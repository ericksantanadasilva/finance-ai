'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

// 1. Garantir que a chave existe
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY não configurada no .env');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function processTransactionWithAI(userInput: string) {
  try {
    const categories = await prisma.category.findMany({
      select: { name: true },
    });
    const categoryList = categories.map((c) => c.name).join(', ');

    // 2. FORÇANDO A VERSÃO E O NOME TÉCNICO
    // Testaremos o 'gemini-1.5-flash-latest' que costuma ser o alias mais estável
    const model = genAI.getGenerativeModel(
      {
        model: 'gemini-2.5-flash',
      },
      { apiVersion: 'v1' }
    );

    // Pega a data atual no formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const prompt = `
  Você é um sistema de extração de dados financeiros de alta precisão.
  Hoje é dia: ${today}.
  
  Sua tarefa é transformar o texto do usuário em um array JSON de transações.
  
  REGRAS DE CATEGORIA:
  1. Use EXATAMENTE um destes nomes: [${
    categoryList || 'Alimentação, Transporte, Lazer, Outros'
  }].
  2. Nunca crie categorias novas. Se não souber onde colocar, use "Outros".
  3. "Mercadinho" ou "iFood" devem ser "Alimentação".
  4. "Bônus" ou "Salário" devem ser "Salário" (ou a categoria de entrada que estiver na lista).

  REGRAS DE DATA:
  - "Ontem" deve ser calculado com base em ${today}.
  - Se o usuário não disser o ano, use o ano de ${today}.
  - Formato: YYYY-MM-DD.

  REGRAS DE FORMATO:
  - Retorne APENAS o código JSON puro, sem textos explicativos, sem crases de markdown.
  - Campos: description (string), amount (number positivo), type ("income" ou "expense"), category (string), date (string).

  TEXTO DO USUÁRIO: "${userInput}"
`;

    // 3. Chamada simples
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Limpeza de Markdown
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error: any) {
    // Se o erro 404 persistir, o problema é a região ou a conta do Google Cloud
    console.error('ERRO REAL DA IA:', error.message);

    // TENTATIVA DE FALLBACK (Se o Flash falhar, tenta o Pro)
    if (error.message.includes('404')) {
      console.log('Tentando fallback para gemini-pro...');
      // Adicione aqui uma lógica similar usando "gemini-pro" se desejar
    }
    return null;
  }
}
