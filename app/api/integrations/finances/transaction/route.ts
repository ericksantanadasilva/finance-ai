import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-auth';

interface CreateTransactionBody {
  userId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'income' | 'expense';
  description: string;
  categoryName: string;
  date?: string;
}

export async function POST(request: Request) {
  // 1. Validação de segurança via x-api-key (n8n)
  const authError = validateApiKey(request);
  if (authError) {
    return authError;
  }

  try {
    const body: Partial<CreateTransactionBody> = await request
      .json()
      .catch(() => ({}));
    const { userId, amount, type, description, categoryName, date } = body;

    // 2. Validações de campos obrigatórios
    if (
      !userId ||
      amount === undefined ||
      amount === null ||
      !type ||
      !description ||
      !categoryName
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: userId, amount, type, description, categoryName',
        },
        { status: 400 },
      );
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 },
      );
    }

    const normalizedType = type.toLowerCase();
    if (normalizedType !== 'income' && normalizedType !== 'expense') {
      return NextResponse.json(
        { error: 'type must be either INCOME or EXPENSE' },
        { status: 400 },
      );
    }

    // 3. Tratamento de datas
    const transactionDate = date ? new Date(date) : new Date();
    if (isNaN(transactionDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 },
      );
    }

    // Define data de competência (primeiro dia do mês ao meio-dia)
    const referenceDate = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      1,
      12,
      0,
      0,
    );

    const trimmedCategoryName = categoryName.trim();

    // 4. Trata a categoria: busca existente ou cria uma nova associada ao usuário
    const category = await prisma.category.upsert({
      where: {
        name_userId: {
          name: trimmedCategoryName,
          userId,
        },
      },
      create: {
        name: trimmedCategoryName,
        userId,
        type: normalizedType,
        color: normalizedType === 'income' ? 'bg-emerald-500' : 'bg-zinc-500',
      },
      update: {},
    });

    // 5. Cria a transação financeira
    const transaction = await prisma.transaction.create({
      data: {
        description: description.trim(),
        amount: parsedAmount,
        date: transactionDate,
        referenceDate,
        type: normalizedType,
        userId,
        categoryId: category.id,
        aiGenerated: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // 6. Retorna status 201 com o objeto da transação criada
    return NextResponse.json(
      {
        ...transaction,
        amount: Number(transaction.amount),
        date: transaction.date.toISOString(),
        referenceDate: transaction.referenceDate.toISOString(),
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Erro ao criar transação via integração:', error);

    // Se o usuário não existir no banco (Foreign Key Constraint)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'User not found in system' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
