import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-auth';
import { Prisma } from '@/prisma/generated/client';

export async function GET(request: Request) {
  // 1. Validação de segurança via x-api-key (n8n)
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const categoryName = searchParams.get('categoryName');
    const dateField = searchParams.get('dateField'); // 'date' (padrão), 'referenceDate' (competência) ou 'createdAt'

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 },
      );
    }

    // 2. Montagem dos filtros dinâmicos
    const where: Prisma.TransactionWhereInput = { userId };

    if (startDate || endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};

      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          dateFilter.gte = start;
        }
      }

      if (endDate) {
        let end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          // Se for formato apenas de data (ex: '2026-03-31'), considera até o final do dia
          if (endDate.length === 10) {
            end = new Date(`${endDate}T23:59:59.999Z`);
          }
          dateFilter.lte = end;
        }
      }

      // Aplica na data financeira 'date' por padrão ou 'createdAt' se explicitado
      if (dateField === 'createdAt') {
        where.createdAt = dateFilter;
      } else if (dateField === 'referenceDate') {
        where.referenceDate = dateFilter;
      } else {
        where.date = dateFilter;
      }
    }

    if (categoryName) {
      where.category = {
        name: { equals: categoryName.trim(), mode: 'insensitive' },
      };
    }

    // 3. Agregação direta no Postgres para máxima performance
    // Utiliza case-insensitive/ambas variações para cobrir 'expense'/'EXPENSE' e 'income'/'INCOME'
    const [expenseAgg, incomeAgg, count] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          ...where,
          type: { in: ['expense', 'EXPENSE'] },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          ...where,
          type: { in: ['income', 'INCOME'] },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.count({ where }),
    ]);

    const totalExpense = Number(expenseAgg._sum.amount ?? 0);
    const totalIncome = Number(incomeAgg._sum.amount ?? 0);
    const balance = totalIncome - totalExpense;

    return NextResponse.json({
      period: { startDate, endDate },
      category: categoryName || 'Todas',
      totalIncome,
      totalExpense,
      balance,
      transactionCount: count,
    });
  } catch (error) {
    console.error('Erro ao consultar resumo financeiro:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
