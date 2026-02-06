'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function getCategoryStats(month?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Não autorizado');

  let whereClause: any = {
    userId: user.id,
    type: 'expense', // Foco em análise de gastos
  };

  // Lógica nativa para filtrar o mês
  if (month) {
    const [year, m] = month.split('-').map(Number);

    // Início do mês: dia 1 às 00:00:00
    const startDate = new Date(year, m - 1, 1);
    // Fim do mês: dia 0 do mês seguinte (que é o último dia do mês atual) às 23:59:59
    const endDate = new Date(year, m, 0, 23, 59, 59);

    whereClause.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  // Agrupamento no Prisma
  const stats = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: whereClause,
    _sum: {
      amount: true,
    },
  });

  // Busca as categorias para pegar nomes e cores
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
  });

  // Formata os dados para o gráfico
  return stats
    .map((item) => {
      const category = categories.find((c) => c.id === item.categoryId);
      return {
        name: category?.name || 'Outros',
        value: Number(item._sum.amount) || 0,
        color: category?.color || '#71717a',
      };
    })
    .sort((a, b) => b.value - a.value);
}
