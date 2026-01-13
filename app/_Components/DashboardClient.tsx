'use client';

import { useEffect, useState } from 'react';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Bell,
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
} from 'recharts';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  // Ajustado para aceitar exatamente o que o Prisma envia (incluindo null)
  category: {
    id: string;
    name: string;
    color: string;
    createdAt: Date;
    type: string;
    userId: string;
  } | null; // O Prisma retorna null se não houver categoria
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function DashboardClient({
  initialTransactions,
}: {
  initialTransactions: Transaction[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [range, setRange] = useState(6);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });

  // --- LÓGICA DO GRÁFICO CORRIGIDA ---
  const getChartData = () => {
    const data = [];
    const now = new Date();

    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

      const monthName = d
        .toLocaleDateString('pt-BR', { month: 'short' })
        .replace('.', '')
        .toUpperCase();

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

      data.push({
        name: monthName,
        receitas: income,
        despesas: expense,
      });
    }
    return data;
  };

  const chartData = getChartData();

  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-500/30'>
      <TransactionDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* NAVBAR */}
      <header className='border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='bg-emerald-500 p-2 rounded-lg'>
              <Wallet className='w-5 h-5 text-zinc-950' />
            </div>
            <span className='font-bold text-lg tracking-tight'>Finance.ai</span>
          </div>
          {/* ... Botões da Navbar (Omitidos para brevidade, mas mantidos iguais) ... */}
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8'>
        {/* HEADER */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold text-white'>Visão Geral</h1>
            <p className='text-zinc-400 text-sm'>Bem-vindo de volta!</p>
          </div>
          <div className='flex gap-3'>
            <button className='flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-white px-4 py-2 rounded-lg text-sm transition-all'>
              <Sparkles className='w-4 h-4 text-purple-400' />
              <span>Importar com IA</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className='flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg'
            >
              <Plus className='w-4 h-4' />
              <span>Nova Transação</span>
            </button>
          </div>
        </div>

        {/* CARDS */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {/* Card 1: Saldo */}
          <div className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl relative overflow-hidden group hover:border-zinc-700 transition-all'>
            <div className='absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity'>
              <Wallet className='w-16 h-16 text-emerald-500' />
            </div>
            <p className='text-sm font-medium text-zinc-400 mb-1'>
              Saldo Atual
            </p>
            <h3 className='text-3xl font-bold text-white'>
              {formatMoney(balance)}
            </h3>
            <p className='text-xs text-emerald-400 mt-2 flex items-center gap-1'>
              <span className='bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-500 font-semibold'>
                Total
              </span>
              calculado automaticamente
            </p>
          </div>

          {/* Card 2: Entradas */}
          <div className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-all'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-2 bg-zinc-800/50 rounded-lg'>
                <ArrowUpCircle className='w-5 h-5 text-emerald-500' />
              </div>
              <span className='text-zinc-500 text-xs uppercase font-bold'>
                Receitas
              </span>
            </div>
            <h3 className='text-2xl font-bold text-white'>
              {formatMoney(totalIncome)}
            </h3>
            <p className='text-xs text-zinc-500 mt-1'>Acumulado</p>
          </div>

          {/* Card 3: Saídas */}
          <div className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-all'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-2 bg-zinc-800/50 rounded-lg'>
                <ArrowDownCircle className='w-5 h-5 text-rose-500' />
              </div>
              <span className='text-zinc-500 text-xs uppercase font-bold'>
                Despesas
              </span>
            </div>
            <h3 className='text-2xl font-bold text-white'>
              {formatMoney(totalExpense)}
            </h3>
            <p className='text-xs text-zinc-500 mt-1'>Acumulado</p>
          </div>
        </div>

        {/* GRÁFICO E LISTA */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='font-semibold text-white'>Fluxo de Caixa</h3>
              <select
                value={range}
                onChange={(e) => setRange(Number(e.target.value))}
                className='bg-zinc-800 border-none text-xs text-zinc-300 rounded p-1 outline-none cursor-pointer hover:bg-zinc-700 transition-colors'
              >
                <option value={3}>Últimos 3 meses</option>
                <option value={6}>Últimos 6 meses</option>
                <option value={12}>Último ano</option>
              </select>
            </div>

            <div className='h-64 w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                >
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
                    itemStyle={{ fontSize: '12px' }}
                    formatter={(value: any) => formatMoney(Number(value))}
                  />
                  <Bar
                    dataKey='receitas'
                    name='Receitas'
                    fill='#10b981'
                    radius={[4, 4, 0, 0]}
                    barSize={range > 6 ? 15 : 25}
                  />
                  <Bar
                    dataKey='despesas'
                    name='Despesas'
                    fill='#ef4444'
                    radius={[4, 4, 0, 0]}
                    barSize={range > 6 ? 15 : 25}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LISTA RECENTES */}
          <div className='bg-zinc-900/50 border border-zinc-800 rounded-xl p-6'>
            <h3 className='font-semibold text-white mb-6'>Recentes</h3>
            <div className='space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar'>
              {transactions.length === 0 ? (
                <div className='text-center py-8 text-zinc-500 text-sm'>
                  Nenhuma transação encontrada.
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className='flex items-center justify-between group p-2 rounded-lg hover:bg-zinc-900 transition-all'
                  >
                    <div className='flex items-center gap-3'>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'income'
                            ? 'bg-emerald-500/10'
                            : 'bg-rose-500/10'
                        }`}
                      >
                        {transaction.type === 'income' ? (
                          <ArrowUpCircle className='w-4 h-4 text-emerald-500' />
                        ) : (
                          <ArrowDownCircle className='w-4 h-4 text-rose-500' />
                        )}
                      </div>
                      <div>
                        <p className='text-sm font-medium text-white'>
                          {transaction.description}
                        </p>
                        <p className='text-xs text-zinc-500'>
                          {transaction.category?.name || 'Geral'} •{' '}
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        transaction.type === 'income'
                          ? 'text-emerald-500'
                          : 'text-white'
                      }`}
                    >
                      {transaction.type === 'expense' && '- '}
                      {formatMoney(transaction.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
