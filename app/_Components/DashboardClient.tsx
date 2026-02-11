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
    new Date().toISOString().slice(0, 7),
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
  const balance = totalIncome - totalExpense;

  // Define qual mês enviar para o Dialog (se estiver em 'all', envia o mês atual)
  const referenceForDialog =
    categoryTimeRange === 'all'
      ? new Date().toISOString().slice(0, 7)
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
          <h1 className='text-xl sm:text-2xl font-black uppercase tracking-tight'>
            Visão Geral
          </h1>
          <p className='text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium'>
            Análise baseada no mês de competência.
          </p>
        </div>
        <div className='flex gap-2 w-full sm:w-auto'>
          <button
            onClick={() => router.push('/import')}
            className='flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface border border-border-custom px-4 py-2.5 rounded-xl text-xs font-black tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-sm uppercase'
          >
            <Sparkles className='w-4 h-4 text-purple-500' /> Importar IA
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className='flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 uppercase'
          >
            <Plus className='w-4 h-4' /> Nova
          </button>
        </div>
      </div>

      {/* CARDS */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
        <div className='bg-surface border border-border-custom p-6 rounded-2xl relative overflow-hidden shadow-sm'>
          <p className='text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-black tracking-[0.15em] mb-1'>
            Saldo Mensal
          </p>
          <h3 className='text-2xl sm:text-3xl font-black text-foreground tracking-tight'>
            {formatMoney(balance)}
          </h3>
          <Wallet className='absolute -right-2 -bottom-2 w-16 h-16 text-zinc-900/5 dark:text-white/5' />
        </div>
        <div className='bg-surface border border-border-custom p-6 rounded-2xl flex justify-between items-center shadow-sm'>
          <div>
            <p className='text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-black tracking-[0.15em] mb-1'>
              Receitas
            </p>
            <h3 className='text-2xl font-black text-emerald-600 dark:text-emerald-500 tracking-tight'>
              {formatMoney(totalIncome)}
            </h3>
          </div>
          <ArrowUpCircle className='w-8 h-8 text-emerald-500 opacity-20' />
        </div>
        <div className='bg-surface border border-border-custom p-6 rounded-2xl flex justify-between items-center shadow-sm'>
          <div>
            <p className='text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-black tracking-[0.15em] mb-1'>
              Despesas
            </p>
            <h3 className='text-2xl font-black text-rose-600 dark:text-rose-500 tracking-tight'>
              {formatMoney(totalExpense)}
            </h3>
          </div>
          <ArrowDownCircle className='w-8 h-8 text-rose-500 opacity-20' />
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8'>
        <div className='lg:col-span-2 bg-surface border border-border-custom p-4 sm:p-6 rounded-2xl min-h-[350px] sm:h-[450px] shadow-sm'>
          <div className='flex items-center justify-between mb-8'>
            <h3 className='font-black text-foreground text-xs sm:text-sm uppercase tracking-widest'>
              Fluxo Mensal
            </h3>
            <select
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
              className='bg-background border border-border-custom text-[10px] sm:text-xs text-zinc-500 rounded-lg px-2 py-1.5 outline-none font-bold uppercase'
            >
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>1 ano</option>
            </select>
          </div>
          <ResponsiveContainer width='100%' height='85%'>
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
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                }}
                formatter={(v: any) => formatMoney(v)}
              />
              <Bar dataKey='receitas' fill='#10b981' radius={[4, 4, 0, 0]} />
              <Bar dataKey='despesas' fill='#ef4444' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CATEGORIAS */}
        <div className='bg-surface border border-border-custom p-4 sm:p-6 rounded-2xl flex flex-col min-h-[400px] shadow-sm'>
          <div className='flex items-center justify-between mb-1'>
            <h3 className='font-black text-foreground text-xs sm:text-sm uppercase tracking-widest'>
              Categorias
            </h3>
            <select
              value={categoryTimeRange}
              onChange={(e) => setCategoryTimeRange(e.target.value)}
              className='bg-background border border-border-custom text-[10px] text-zinc-500 rounded-lg px-2 py-1 outline-none font-bold uppercase cursor-pointer max-w-[150px]'
            >
              <option value='all'>Todos os meses</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {new Date(m + '-02').toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </option>
              ))}
            </select>
          </div>
          <p className='text-[10px] text-zinc-500 mb-6 uppercase tracking-[0.2em] font-bold'>
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
              <PieIcon className='w-4 h-4 text-zinc-400 mb-1' />
              <span className='text-foreground font-black text-[11px]'>
                {formatMoney(totalCategoryExpense)}
              </span>
            </div>
          </div>

          <div className='mt-6 space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar text-foreground'>
            {categoryData.length > 0 ? (
              categoryData.map((cat, i) => (
                <div
                  key={i}
                  className='flex justify-between items-center group'
                >
                  <div className='flex items-center gap-2'>
                    <div
                      className='w-2 h-2 rounded-full'
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className='text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-tight truncate max-w-[120px]'>
                      {cat.name}
                    </span>
                  </div>
                  <span className='text-[11px] font-black'>
                    {formatMoney(cat.value)}
                  </span>
                </div>
              ))
            ) : (
              <div className='flex flex-col items-center justify-center h-full text-zinc-500 gap-2 opacity-50'>
                <p className='text-[10px] font-bold uppercase tracking-widest'>
                  Sem dados
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
