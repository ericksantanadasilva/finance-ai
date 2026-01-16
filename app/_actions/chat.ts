'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getTransactions } from './transactions';
import { getCategories } from './categories';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function sendMessage(message: string, history: any[]) {
  const transactions = await getTransactions();
  const categories = await getCategories();

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `
    Você é um assistente financeiro pessoal chamado Finance.ai.
    Contexto do usuário:
    - Transações recentes: ${JSON.stringify(transactions.slice(0, 5))}
    - Categorias disponíveis: ${categories.map((c) => c.name).join(', ')}
    - Data atual: ${new Date().toLocaleDateString()}

    Sua tarefa é analisar a mensagem do usuário: "${message}".
    Responda SEMPRE no formato JSON abaixo:
    {
      "reply": "Sua resposta amigável aqui",
      "action": "CREATE_TRANSACTION" | "CREATE_GOAL" | "ANALYZE" | "NONE",
      "data": { 
         "amount": number, 
         "description": "string", 
         "type": "income" | "expense", 
         "category": "string" 
      }
    }
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
