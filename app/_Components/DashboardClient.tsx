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
  const [range, setRange] = useState(6); // Filtro de meses

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const formatMoney = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v);

  // --- LÓGICA: FLUXO DE CAIXA MENSAL (GRÁFICO PRINCIPAL) ---
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
        const tDate = new Date(t.date);
        return (
          tDate.getMonth() === d.getMonth() &&
          tDate.getFullYear() === d.getFullYear()
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

  // --- LÓGICA: GASTOS POR CATEGORIA (Mês Atual) ---
  const getCategoryData = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const categoryMap: Record<string, { value: number; color: string }> = {};

    transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          new Date(t.date).getMonth() === currentMonth &&
          new Date(t.date).getFullYear() === currentYear
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

  // --- CÁLCULOS TOTAIS ---
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-50 p-8 space-y-8'>
      <TransactionDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* HEADER */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold'>Visão Geral</h1>
          <p className='text-zinc-400 text-sm'>
            Acompanhe sua saúde financeira em tempo real.
          </p>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => router.push('/import')}
            className='flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-sm hover:bg-zinc-800 transition-all'
          >
            <Sparkles className='w-4 h-4 text-purple-400' /> Importar com IA
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className='flex items-center gap-2 bg-emerald-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-500 transition-all shadow-lg'
          >
            <Plus className='w-4 h-4' /> Nova Transação
          </button>
        </div>
      </div>

      {/* CARDS */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl'>
          <p className='text-zinc-400 text-xs uppercase font-bold mb-1'>
            Saldo Total
          </p>
          <h3 className='text-3xl font-bold'>{formatMoney(balance)}</h3>
        </div>
        <div className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex justify-between items-center'>
          <div>
            <p className='text-emerald-500 text-xs uppercase font-bold mb-1'>
              Receitas
            </p>
            <h3 className='text-2xl font-bold'>{formatMoney(totalIncome)}</h3>
          </div>
          <ArrowUpCircle className='w-8 h-8 text-emerald-500/20' />
        </div>
        <div className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex justify-between items-center'>
          <div>
            <p className='text-rose-500 text-xs uppercase font-bold mb-1'>
              Despesas
            </p>
            <h3 className='text-2xl font-bold'>{formatMoney(totalExpense)}</h3>
          </div>
          <ArrowDownCircle className='w-8 h-8 text-rose-500/20' />
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* GRÁFICO PRINCIPAL */}
        <div className='lg:col-span-2 bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl h-[450px]'>
          <div className='flex items-center justify-between mb-8'>
            <h3 className='font-bold text-zinc-200'>Fluxo de Caixa</h3>
            <select
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
              className='bg-zinc-800 border-none text-xs text-zinc-300 rounded p-1.5 outline-none cursor-pointer'
            >
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Último ano</option>
            </select>
          </div>
          <ResponsiveContainer width='100%' height='85%'>
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray='3 3'
                vertical={false}
                stroke='#27272a'
              />
              <XAxis
                dataKey='name'
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 10 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 10 }}
              />
              <Tooltip
                cursor={{ fill: '#ffffff0a' }}
                contentStyle={{
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                }}
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

        {/* GRÁFICO DE CATEGORIAS */}
        <div className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col'>
          <h3 className='font-bold mb-1 text-zinc-200'>Gastos por Categoria</h3>
          <p className='text-[10px] text-zinc-500 mb-6 uppercase tracking-wider'>
            Mês Atual
          </p>
          <div className='h-64 relative'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey='value'
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke='none' />
                  ))}
                </Pie>
                {/* <Tooltip
                  formatter={(v: number | undefined) => formatMoney(v ?? 0)}
                  contentStyle={{
                    backgroundColor: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: '#f4f4f5' }} // Garante que o nome da categoria fique legível
                /> */}
              </PieChart>
            </ResponsiveContainer>
            <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
              <span className='text-zinc-500 text-[10px] uppercase font-bold'>
                Gasto Mês
              </span>
              <span className='text-white font-bold text-sm'>
                {formatMoney(totalExpense)}
              </span>
            </div>
          </div>
          <div className='mt-6 space-y-3 flex-1 overflow-y-auto custom-scrollbar'>
            {categoryData.map((cat, i) => (
              <div key={i} className='flex justify-between items-center'>
                <div className='flex items-center gap-3'>
                  <div
                    className='w-3 h-3 rounded-full'
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className='text-sm text-zinc-400'>{cat.name}</span>
                </div>
                <span className='text-sm font-semibold text-zinc-100'>
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
