'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getTransactions } from './transactions';
import { getCategories } from './categories';
import { getGoals } from './goals'; // Importamos as metas

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function sendMessage(message: string, history: any[]) {
  const transactions = await getTransactions();
  const categories = await getCategories();
  const goals = await getGoals(); // Buscamos as metas atuais

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash', // Corrigido para a versão estável atual
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `
    Você é um assistente financeiro pessoal chamado Finance.ai.
    Contexto do usuário:
    - Transações recentes: ${JSON.stringify(transactions.slice(0, 5))}
    - Categorias disponíveis: ${categories.map((c) => c.name).join(', ')}
    - Metas atuais: ${JSON.stringify(goals.map((g) => ({ id: g.id, name: g.name, current: g.currentAmount, target: g.targetAmount })))}
    - Data atual: ${new Date().toLocaleDateString()}

    Sua tarefa é analisar a mensagem do usuário: "${message}".

    REGRAS DE DECISÃO:
    1. CREATE_TRANSACTION: Use se o usuário falar de gastos, compras ou ganhos (ex: "comi um lanche", "recebi 100").
    2. UPDATE_GOAL: Use APENAS se o usuário quiser adicionar/guardar dinheiro em uma meta QUE JÁ EXISTE na lista acima.
    3. CREATE_GOAL: Use se o usuário quiser criar um novo objetivo ou sonho (ex: "quero economizar para X", "cria uma meta para Y").

    REGRAS DE CAMPOS:
    - Para CREATE_TRANSACTION: preencha amount, description, type e category.
    - Para UPDATE_GOAL: preencha goalId, name, amount (valor a somar) e currentAmount (valor atual da meta).
    - Para CREATE_GOAL: preencha name e targetAmount (valor objetivo). Se ele citar data, coloque no campo description.

    Responda EXCLUSIVAMENTE em JSON:
    {
      "reply": "Sua resposta amigável",
      "action": "CREATE_TRANSACTION" | "CREATE_GOAL" | "UPDATE_GOAL" | "NONE",
      "data": { 
          "amount": number (valor da transação ou valor a ser somado na meta), 
          "targetAmount": number (objetivo final da meta - apenas para CREATE_GOAL),
          "description": "string", 
          "type": "income" | "expense", 
          "category": "string",
          "goalId": "string",
          "currentAmount": number,
          "name": "string (nome da meta)"
      }
    }
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
