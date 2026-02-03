'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Sparkles,
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

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const formatMoney = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v);

  const getChartData = () => {
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
  };

  const chartData = getChartData();

  const getCategoryData = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const categoryMap: Record<string, { value: number; color: string }> = {};

    transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          new Date(t.referenceDate).getMonth() === currentMonth &&
          new Date(t.referenceDate).getFullYear() === currentYear,
      )
      .forEach((t) => {
        const catName = t.category?.name || 'Outros';
        const catColor = t.category?.color || '#71717a';
        if (!categoryMap[catName])
          categoryMap[catName] = { value: 0, color: catColor };
        categoryMap[catName].value += t.amount;
      });

    return Object.entries(categoryMap).map(([name, data]) => ({
      name,
      value: data.value,
      color: data.color,
    }));
  };

  const categoryData = getCategoryData();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthTransactions = transactions.filter((t) => {
    const ref = new Date(t.referenceDate);
    return ref.getMonth() === currentMonth && ref.getFullYear() === currentYear;
  });

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className='min-h-screen bg-background text-foreground p-4 sm:p-8 space-y-6 sm:space-y-8 transition-all duration-300'>
      <TransactionDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* HEADER ADAPTATIVO */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-10 lg:pt-0'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold'>Visão Geral</h1>
          <p className='text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm'>
            Dashboard baseado no mês de competência.
          </p>
        </div>
        <div className='flex gap-2 w-full sm:w-auto'>
          <button
            onClick={() => router.push('/import')}
            className='flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface border border-border-custom px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-sm'
          >
            <Sparkles className='w-4 h-4 text-purple-500' /> Importar IA
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className='flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20'
          >
            <Plus className='w-4 h-4' /> Nova
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
        <div className='bg-surface border border-border-custom p-6 rounded-2xl relative overflow-hidden shadow-sm dark:shadow-none'>
          <p className='text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-widest mb-1'>
            Saldo (Competência)
          </p>
          <h3 className='text-2xl sm:text-3xl font-bold text-foreground'>
            {formatMoney(balance)}
          </h3>
          <Wallet className='absolute -right-2 -bottom-2 w-16 h-16 text-zinc-900/5 dark:text-white/5' />
        </div>

        <div className='bg-surface border border-border-custom p-6 rounded-2xl flex justify-between items-center shadow-sm dark:shadow-none'>
          <div>
            <p className='text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-widest mb-1'>
              Receitas
            </p>
            <h3 className='text-2xl font-bold text-emerald-600 dark:text-emerald-500'>
              {formatMoney(totalIncome)}
            </h3>
          </div>
          <ArrowUpCircle className='w-8 h-8 text-emerald-500 opacity-20' />
        </div>

        <div className='bg-surface border border-border-custom p-6 rounded-2xl flex justify-between items-center shadow-sm dark:shadow-none'>
          <div>
            <p className='text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-widest mb-1'>
              Despesas
            </p>
            <h3 className='text-2xl font-bold text-rose-600 dark:text-rose-500'>
              {formatMoney(totalExpense)}
            </h3>
          </div>
          <ArrowDownCircle className='w-8 h-8 text-rose-500 opacity-20' />
        </div>
      </div>

      {/* GRÁFICOS ADAPTATIVOS */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8'>
        <div className='lg:col-span-2 bg-surface border border-border-custom p-4 sm:p-6 rounded-2xl min-h-[350px] sm:h-[450px] shadow-sm'>
          <div className='flex items-center justify-between mb-8'>
            <h3 className='font-bold text-foreground text-sm sm:text-base'>
              Fluxo de Caixa (Faturas)
            </h3>
            <select
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
              className='bg-background border border-border-custom text-[10px] sm:text-xs text-zinc-500 rounded-lg p-1.5 outline-none'
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
                tick={{ fill: 'currentColor', fontSize: 10 }}
                className='text-zinc-400 dark:text-zinc-500'
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'currentColor', fontSize: 10 }}
                className='text-zinc-400 dark:text-zinc-500'
              />
              <Tooltip
                cursor={{ fill: 'currentColor', opacity: 0.05 }}
                contentStyle={{
                  backgroundColor: 'var(--background-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                formatter={(v: any) => formatMoney(v)}
              />
              <Bar
                dataKey='receitas'
                name='Receitas'
                fill='#10b981'
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey='despesas'
                name='Despesas'
                fill='#ef4444'
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PIE CHART CARD */}
        <div className='bg-surface border border-border-custom p-4 sm:p-6 rounded-2xl flex flex-col min-h-[400px] shadow-sm'>
          <h3 className='font-bold mb-1 text-foreground text-sm sm:text-base'>
            Categorias
          </h3>
          <p className='text-[10px] text-zinc-500 mb-6 uppercase tracking-widest font-bold'>
            Fatura Atual
          </p>

          <div className='h-48 sm:h-64 relative'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey='value'
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke='none' />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
              <span className='text-zinc-500 text-[8px] uppercase font-bold tracking-tighter'>
                Total Gasto
              </span>
              <span className='text-foreground font-bold text-xs sm:text-sm'>
                {formatMoney(totalExpense)}
              </span>
            </div>
          </div>

          <div className='mt-6 space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar text-foreground'>
            {categoryData.map((cat, i) => (
              <div key={i} className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div
                    className='w-2 h-2 rounded-full'
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className='text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[100px]'>
                    {cat.name}
                  </span>
                </div>
                <span className='text-xs font-bold'>
                  {formatMoney(cat.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
