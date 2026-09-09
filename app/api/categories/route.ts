import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const categories = await prisma.category.findMany({
      where: { userId },
      select: {
        id: true, // ADICIONE ISSO
        name: true,
        color: true, // Aproveita e manda a cor também!
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 },
    );
  }
}
