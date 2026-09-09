import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const { name, userId } = await request.json();

    if (!userId || !name) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // No Prisma, usamos o modelo 'user' (ou 'User', dependendo do seu schema)
    // O método update exige um 'where' único (geralmente o ID)
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Nome atualizado com sucesso via Prisma',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);

    // Se o Prisma não encontrar o usuário, ele lança um erro específico (P2025)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: 'Erro interno ao atualizar perfil' },
      { status: 500 },
    );
  }
}
