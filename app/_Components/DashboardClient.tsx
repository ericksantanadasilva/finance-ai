'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  PieChart as PieIcon,
} from 'lucide-react';
import TransactionDialog from './TransactionDialog';
import TypeIcon from './TypeIcon';
import {
  ChartLegend,
  ChartTooltip,
  stickerShape,
} from './ChartParts';
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
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatCard } from './StatCard';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export default function DashboardClient({
  initialTransactions,
}: {
  initialTransactions: any[];
}) {
  const router = useRouter();
  // Gráficos: animação curta (300 ms) e desligada com movimento reduzido
  const reducedMotion = useReducedMotion();
  const chartAnimation = {
    isAnimationActive: !reducedMotion,
    animationDuration: 300,
  };
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

  // Saldo pelo pago: receitas e despesas acima contam tudo (competência), o saldo só o pago.
  // Competência futura não entra.
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const signed = (t: { type: string; amount: number }) =>
    t.type === 'income' ? t.amount : -t.amount;
  const sumAmounts = (rows: { amount: number }[]) =>
    rows.reduce((acc, t) => acc + t.amount, 0);

  const paidUntilNow = transactions.filter(
    (t) => t.isPaid && new Date(t.referenceDate) < startOfNextMonth,
  );
  const previousBalance = paidUntilNow
    .filter((t) => new Date(t.referenceDate) < startOfCurrentMonth)
    .reduce((acc, t) => acc + signed(t), 0);
  const balance = paidUntilNow.reduce((acc, t) => acc + signed(t), 0);

  // Pendentes: não pagas com competência até o mês atual; as de meses anteriores estão atrasadas
  const pending = transactions.filter(
    (t) => !t.isPaid && new Date(t.referenceDate) < startOfNextMonth,
  );
  const overdue = pending.filter(
    (t) => new Date(t.referenceDate) < startOfCurrentMonth,
  );
  const pendingRows = [
    {
      type: 'expense',
      label: 'A pagar',
      total: sumAmounts(pending.filter((t) => t.type === 'expense')),
      overdue: sumAmounts(overdue.filter((t) => t.type === 'expense')),
    },
    {
      type: 'income',
      label: 'A receber',
      total: sumAmounts(pending.filter((t) => t.type === 'income')),
      overdue: sumAmounts(overdue.filter((t) => t.type === 'income')),
    },
  ];
  const hasPending = pending.length > 0;
  const [toPay, toReceive] = pendingRows.map((r) => r.total);
  const forecast = balance + toReceive - toPay;

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
        <StatCard
          label='Saldo Atual'
          icon={Wallet}
          value={formatMoney(balance)}
          note={`Conta só o que foi pago. Meses anteriores: ${formatMoney(previousBalance)}`}
        />
        <StatCard
          label='Receitas'
          icon={ArrowUpCircle}
          value={formatMoney(totalIncome)}
          tone='income'
        />
        <StatCard
          label='Despesas'
          icon={ArrowDownCircle}
          value={formatMoney(totalExpense)}
          tone='expense'
        />

        <Card className='sm:col-span-2'>
          <CardHeader>
            <h2 className='font-bold'>Pendentes</h2>
            <Clock className='w-4 h-4' aria-hidden='true' />
          </CardHeader>
          <CardContent>
            {hasPending ? (
              <>
                <ul className='divide-y divide-border-custom'>
                  {pendingRows.map((row) => (
                    <li key={row.type} className='py-3 first:pt-0 last:pb-0'>
                      <div className='flex items-center justify-between gap-3'>
                        <span className='flex items-center gap-3 text-sm font-bold lowercase'>
                          <TypeIcon type={row.type} />
                          {row.label}
                        </span>
                        <span
                          className={`text-lg font-bold tabular-nums text-right wrap-break-word ${row.type === 'income' ? 'text-income' : 'text-expense'}`}
                        >
                          {formatMoney(row.total)}
                        </span>
                      </div>
                      {row.overdue > 0 && (
                        <p className='mt-2 ml-11 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground'>
                          <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold lowercase bg-surface text-warning border-2 border-warning'>
                            <Clock className='w-3 h-3' aria-hidden='true' />
                            Atrasada
                          </span>
                          {formatMoney(row.overdue)} de meses anteriores
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <div className='mt-4 flex justify-end'>
                  <Link
                    href='/Transactions?status=pending&month=all'
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    Ver pendentes
                  </Link>
                </div>
              </>
            ) : (
              <p className='flex items-center gap-2 rounded-xl border border-border-custom p-4 text-sm font-medium text-muted-foreground'>
                <CheckCircle2 className='w-4 h-4 shrink-0' aria-hidden='true' />
                Nada pendente até este mês.
              </p>
            )}
          </CardContent>
        </Card>

        <StatCard
          label='Saldo previsto'
          icon={Wallet}
          value={formatMoney(forecast)}
          note={
            hasPending
              ? 'Saldo atual + a receber − a pagar'
              : 'Igual ao saldo atual: nada pendente'
          }
          className='sm:col-span-2 lg:col-span-1'
        />
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
            <ChartLegend />
            {/* Ticks herdam a cor (currentColor) e a fonte mono deste wrapper */}
            <div className='relative flex-1 min-h-72 sm:min-h-80 text-muted-foreground [&_.recharts-cartesian-axis-tick-value]:font-mono [&_.recharts-cartesian-axis-tick-value]:lowercase'>
              <div className='absolute inset-0'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={chartData} barGap={6}>
                    <CartesianGrid
                      vertical={false}
                      stroke='currentColor'
                      className='text-border-custom'
                    />
                    <XAxis
                      dataKey='name'
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: 'currentColor',
                        fontSize: 11,
                        fontWeight: 'bold',
                      }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: 'currentColor',
                        fontSize: 11,
                        fontWeight: 'bold',
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: 'currentColor', opacity: 0.08 }}
                      content={(props) => (
                        <ChartTooltip {...props} formatValue={formatMoney} />
                      )}
                    />
                    <Bar
                      dataKey='receitas'
                      maxBarSize={32}
                      {...chartAnimation}
                      shape={stickerShape('receitas')}
                    />
                    <Bar
                      dataKey='despesas'
                      maxBarSize={32}
                      {...chartAnimation}
                      shape={stickerShape('despesas')}
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

            {/* Contorno ink nas fatias via CSS: vence o atributo stroke do SVG */}
            <div className='h-48 sm:h-56 relative [&_.recharts-sector]:stroke-ink [&_.recharts-sector]:stroke-2'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey='value'
                    {...chartAnimation}
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
