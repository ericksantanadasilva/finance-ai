'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getTransactions } from './transactions';
import { getCategories } from './categories';
import { getGoals } from './goals';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function sendMessage(message: string, history: any[]) {
  const transactions = await getTransactions();
  const categories = await getCategories();
  const goals = await getGoals();

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash', // Versão estável com suporte a JSON mode
    generationConfig: { responseMimeType: 'application/json' },
  });

  // Capturamos o mês/ano atual para a IA ter base de cálculo
  const now = new Date();
  const currentMonthYear = now.toISOString().slice(0, 7); // Ex: "2026-02"

  const prompt = `
    Você é um assistente financeiro pessoal chamado Finance.ai.
    Contexto do usuário:
    - Transações recentes: ${JSON.stringify(transactions.slice(0, 5))}
    - Categorias disponíveis: ${categories.map((c) => c.name).join(', ')}
    - Metas atuais: ${JSON.stringify(goals.map((g) => ({ id: g.id, name: g.name, current: g.currentAmount, target: g.targetAmount })))}
    - Mês/Ano Atual: ${currentMonthYear} (Hoje é ${now.toLocaleDateString()})

    Sua tarefa é analisar a mensagem do usuário: "${message}".

    REGRAS DE DECISÃO:
    1. CREATE_TRANSACTION: Gastos, compras ou ganhos.
    2. UPDATE_GOAL: Adicionar dinheiro em meta EXISTENTE.
    3. CREATE_GOAL: Novo objetivo financeiro.

    REGRAS ESPECIAIS DE DATA (IMPORTANTE):
    - Identifique se o usuário menciona QUANDO a transação deve ser contabilizada.
    - Se ele disser "mês que vem", "março", "em abril", preencha o campo "referenceMonth" no formato "YYYY-MM".
    - Exemplo: Se hoje é 2026-02 e ele diz "pagar em março", referenceMonth deve ser "2026-03".
    - Se ele não mencionar mês, o referenceMonth deve ser "${currentMonthYear}".

    Responda EXCLUSIVAMENTE em JSON:
    {
      "reply": "Sua resposta amigável",
      "action": "CREATE_TRANSACTION" | "CREATE_GOAL" | "UPDATE_GOAL" | "NONE",
      "data": { 
          "amount": number, 
          "targetAmount": number,
          "description": "string", 
          "type": "income" | "expense", 
          "category": "string",
          "referenceMonth": "YYYY-MM",
          "goalId": "string",
          "currentAmount": number,
          "name": "string"
      }
    }
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  return JSON.parse(responseText);
}
