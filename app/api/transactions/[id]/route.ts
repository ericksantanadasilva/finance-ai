import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // Tipamos como Promise
) {
  try {
    // O SEGREDO ESTÁ AQUI: Aguardar o params ser resolvido
    const { id } = await params;

    const body = await request.json();
    const {
      userId,
      amount,
      description,
      categoryId,
      date,
      type,
      referenceMonth,
    } = body;

    // Agora o id e o userId estarão disponíveis corretamente
    if (!id || !userId) {
      return NextResponse.json(
        { error: `Dados incompletos. ID: ${id}, User: ${userId}` },
        { status: 400 },
      );
    }

    const [year, month] = referenceMonth.split('-').map(Number);
    const referenceDate = new Date(year, month - 1, 1, 12, 0, 0);

    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        description,
        amount: Number(amount),
        date: new Date(date),
        referenceDate,
        type,
        categoryId,
      },
    });

    return NextResponse.json({ success: true, updatedTransaction });
  } catch (error) {
    console.error('Erro no PUT:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'ID ou UserID ausentes' },
        { status: 400 },
      );
    }

    await prisma.transaction.delete({
      where: {
        id: id,
        userId: userId, // Segurança máxima
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
