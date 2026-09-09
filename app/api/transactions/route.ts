import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Aqui replicamos a lógica da OTIMIZAÇÃO 1 e 2 da sua Server Action
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        referenceDate: true,
        type: true,
        categoryId: true,
        category: {
          select: {
            name: true,
            color: true,
          },
        },
      },
    });

    // Tratamento idêntico ao da Server Action
    const formattedTransactions = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      referenceDate: t.referenceDate.toISOString(),
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      amount,
      description,
      categoryId, // Recebendo o ID direto do que foi selecionado no Modal
      date,
      type,
      referenceMonth,
    } = body;

    if (!userId || !categoryId) {
      return NextResponse.json(
        { error: 'Dados insuficientes' },
        { status: 400 },
      );
    }

    // Cálculo da data de competência
    const [year, month] = referenceMonth.split('-').map(Number);
    const referenceDate = new Date(year, month - 1, 1, 12, 0, 0);

    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount: Number(amount),
        date: new Date(date),
        referenceDate,
        type,
        userId,
        categoryId, // Relacionamento direto
      },
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar transação' },
      { status: 500 },
    );
  }
}
