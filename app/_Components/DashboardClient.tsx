'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Sparkles,
  PieChart as PieIcon,
} from 'lucide-react';
import TransactionDialog from './TransactionDialog';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
} from 'recharts';
import { currentMonthISO } from '@/app/utils/dates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Valor grande dos cards de resumo. No lg os 3 cards dividem a largura com a
// sidebar, então o número diminui um pouco para caber valores de 6 dígitos.
const statValueClass =
  'text-3xl lg:text-2xl xl:text-3xl font-bold tabular-nums tracking-tight wrap-break-word';

export default function DashboardClient({
  initialTransactions,
}: {
  initialTransactions: any[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [range, setRange] = useState(6);

  // Filtro de tempo: Default para o mês atual (ex: "2026-02")
  // Este estado controla o gráfico de categorias e define a competência da nova transação
  const [categoryTimeRange, setCategoryTimeRange] = useState<string>(
    currentMonthISO(),
  );

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const formatMoney = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v);

  // Gera lista de meses únicos das transações para o Select
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t) => {
      const date = new Date(t.referenceDate);
      months.add(date.toISOString().slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Lógica do Gráfico de Barras (Fluxo Mensal)
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d
        .toLocaleDateString('pt-BR', { month: 'short' })
        .toUpperCase()
        .replace('.', '');

      const monthTransactions = transactions.filter((t) => {
        const tRefDate = new Date(t.referenceDate);
        return (
          tRefDate.getMonth() === d.getMonth() &&
          tRefDate.getFullYear() === d.getFullYear()
        );
      });

      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);
      const expense = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

      data.push({ name: monthLabel, receitas: income, despesas: expense });
    }
    return data;
  }, [range, transactions]);

  // Lógica do Gráfico de Rosca (Categorias)
  const categoryData = useMemo(() => {
    const categoryMap: Record<string, { value: number; color: string }> = {};

    transactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        if (categoryTimeRange === 'all') return true;

        const ref = new Date(t.referenceDate);
        return ref.toISOString().slice(0, 7) === categoryTimeRange;
      })
      .forEach((t) => {
        const catName = t.category?.name || 'Outros';
        const catColor = t.category?.color || '#71717a';
        if (!categoryMap[catName])
          categoryMap[catName] = { value: 0, color: catColor };
        categoryMap[catName].value += t.amount;
      });

    return Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        value: data.value,
        color: data.color,
      }))
      .sort((a, b) => b.value - a.value);
  }, [categoryTimeRange, transactions]);

  const totalCategoryExpense = categoryData.reduce(
    (acc, cur) => acc + cur.value,
    0,
  );

  // Cálculos do Mês Atual (Cards de cima sempre mostram o hoje)
  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    const ref = new Date(t.referenceDate);
    return (
      ref.getMonth() === now.getMonth() &&
      ref.getFullYear() === now.getFullYear()
    );
  });

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  // Sobra acumulada de todos os meses anteriores ao atual (competência futura não entra)
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousBalance = transactions
    .filter((t) => new Date(t.referenceDate) < startOfCurrentMonth)
    .reduce(
      (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount),
      0,
    );
  const balance = previousBalance + totalIncome - totalExpense;

  // Define qual mês enviar para o Dialog (se estiver em 'all', envia o mês atual)
  const referenceForDialog =
    categoryTimeRange === 'all'
      ? currentMonthISO()
      : categoryTimeRange;

  return (
    <div className='min-h-screen bg-background text-foreground p-4 sm:p-8 space-y-6 sm:space-y-8 transition-all duration-300'>
      <TransactionDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        referenceMonth={referenceForDialog}
      />

      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-10 lg:pt-0'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold lowercase'>
            Visão Geral
          </h1>
          <p className='text-muted-foreground text-xs sm:text-sm font-medium'>
            Análise baseada no mês de competência.
          </p>
        </div>
        <div className='flex gap-3 w-full sm:w-auto'>
          <Button
            variant='ai'
            onClick={() => router.push('/import')}
            className='flex-1 sm:flex-none'
          >
            <Sparkles className='w-4 h-4' /> Importar IA
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className='flex-1 sm:flex-none'
          >
            <Plus className='w-4 h-4' /> Nova
          </Button>
        </div>
      </div>

      {/* CARDS: faixa com o rótulo e o valor grande embaixo */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
        <Card>
          <CardHeader>
            <h2 className='font-bold'>Saldo Atual</h2>
            <Wallet className='w-4 h-4' aria-hidden='true' />
          </CardHeader>
          <CardContent>
            <p className={statValueClass}>{formatMoney(balance)}</p>
            <p className='text-muted-foreground text-xs font-medium mt-1'>
              Meses anteriores: {formatMoney(previousBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className='font-bold'>Receitas</h2>
            <ArrowUpCircle className='w-4 h-4' aria-hidden='true' />
          </CardHeader>
          <CardContent>
            <p className={cn(statValueClass, 'text-income')}>
              {formatMoney(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className='font-bold'>Despesas</h2>
            <ArrowDownCircle className='w-4 h-4' aria-hidden='true' />
          </CardHeader>
          <CardContent>
            <p className={cn(statValueClass, 'text-expense')}>
              {formatMoney(totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8'>
        <Card className='lg:col-span-2 flex flex-col'>
          <CardHeader>
            <h2 className='font-bold'>Fluxo Mensal</h2>
            <Select
              value={String(range)}
              onValueChange={(v) => setRange(Number(v))}
            >
              <SelectTrigger
                size='sm'
                aria-label='Período do gráfico'
                className='w-auto'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='3'>3 meses</SelectItem>
                <SelectItem value='6'>6 meses</SelectItem>
                <SelectItem value='12'>1 ano</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          {/* O gráfico ocupa a área que sobra; o absolute dá a ele uma altura
              definida, mesmo quando o card estica para acompanhar o vizinho */}
          <CardContent className='flex-1 flex flex-col p-4 sm:p-6'>
            <div className='relative flex-1 min-h-72 sm:min-h-80'>
              <div className='absolute inset-0'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray='3 3'
                      vertical={false}
                      stroke='currentColor'
                      className='text-zinc-200 dark:text-zinc-800'
                    />
                    <XAxis
                      dataKey='name'
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: 'currentColor',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: 'currentColor',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: 'currentColor', opacity: 0.05 }}
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border-custom)',
                        borderRadius: '12px',
                      }}
                      formatter={(v: any) => formatMoney(v)}
                    />
                    <Bar
                      dataKey='receitas'
                      fill='#10b981'
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey='despesas'
                      fill='#ef4444'
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CATEGORIAS */}
        <Card className='flex flex-col min-h-100'>
          <CardHeader>
            <h2 className='font-bold'>Categorias</h2>
            <Select
              value={categoryTimeRange}
              onValueChange={setCategoryTimeRange}
            >
              <SelectTrigger
                size='sm'
                aria-label='Mês das categorias'
                className='w-auto max-w-40'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos os meses</SelectItem>
                {availableMonths.map((m) => (
                  <SelectItem key={m} value={m}>
                    {new Date(m + '-02').toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>

          <CardContent className='flex-1 flex flex-col p-4 sm:p-6'>
            <p className='text-xs text-muted-foreground font-medium lowercase mb-4'>
              Análise de Gastos
            </p>

            <div className='h-48 sm:h-56 relative'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey='value'
                    stroke='none'
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.color}
                        style={{ outline: 'none' }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                <PieIcon
                  className='w-4 h-4 text-muted-foreground mb-1'
                  aria-hidden='true'
                />
                <span className='text-sm font-bold tabular-nums'>
                  {formatMoney(totalCategoryExpense)}
                </span>
              </div>
            </div>

            {/* LEGENDA */}
            <div className='mt-6 space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar'>
              {categoryData.length > 0 ? (
                categoryData.map((cat, i) => (
                  <div key={i} className='flex justify-between items-center gap-3'>
                    <div className='flex items-center gap-2 min-w-0'>
                      <span
                        className='size-3 shrink-0 rounded-full border-2 border-ink'
                        style={{ backgroundColor: cat.color }}
                        aria-hidden='true'
                      />
                      <span className='text-xs font-medium text-muted-foreground truncate'>
                        {cat.name}
                      </span>
                    </div>
                    <span className='text-xs font-bold tabular-nums shrink-0'>
                      {formatMoney(cat.value)}
                    </span>
                  </div>
                ))
              ) : (
                <div className='flex flex-col items-center justify-center h-full'>
                  <p className='text-xs font-medium text-muted-foreground lowercase'>
                    Sem dados
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
