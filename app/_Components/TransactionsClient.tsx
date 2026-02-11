'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  CalendarDays,
} from 'lucide-react';
import { TransactionRowActions } from './TransactionRowActions';
import TransactionDialog from '../_Components/TransactionDialog';

export default function TransactionsClient({
  initialTransactions,
}: {
  initialTransactions: any[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    initialTransactions.forEach((t) => {
      if (t.category?.name) cats.add(t.category.name);
    });
    return Array.from(cats).sort();
  }, [initialTransactions]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    initialTransactions.forEach((t) => {
      const date = new Date(t.referenceDate);
      months.add(date.toISOString().slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [initialTransactions]);

  const filteredTransactions = initialTransactions.filter((tx) => {
    const matchesSearch = tx.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || tx.category?.name === categoryFilter;
    const matchesMonth =
      monthFilter === 'all' || tx.referenceDate.startsWith(monthFilter);

    return matchesSearch && matchesCategory && matchesMonth;
  });

  const handleEdit = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const formatMoney = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v);

  return (
    <div className='min-h-screen bg-background text-foreground p-4 sm:p-8 transition-colors duration-300'>
      <TransactionDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editData={selectedTransaction}
        referenceMonth={
          monthFilter === 'all'
            ? new Date().toISOString().slice(0, 7)
            : monthFilter
        }
      />

      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-12 sm:pt-0'>
        <div>
          <h1 className='text-xl sm:text-2xl font-black uppercase tracking-tight'>
            Transações
          </h1>
          <p className='text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium'>
            Consulte e filtre seu histórico financeiro completo.
          </p>
        </div>
        <button
          onClick={handleNew}
          className='w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-xs font-black tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 uppercase'
        >
          <Plus className='w-4 h-4' /> Nova Transação
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className='bg-surface border border-border-custom rounded-2xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
          <input
            type='text'
            placeholder='Buscar transação...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full bg-background border border-border-custom focus:border-emerald-500/50 rounded-xl pl-12 pr-4 py-3 text-sm font-bold outline-none transition-all placeholder:text-zinc-500 shadow-inner'
          />
        </div>

        <div className='flex flex-wrap sm:flex-nowrap gap-4'>
          <div className='relative min-w-[160px] flex-1 sm:flex-none'>
            <Filter className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400' />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className='w-full bg-background border border-border-custom rounded-xl pl-10 pr-4 py-3 text-[11px] font-black uppercase tracking-tighter outline-none cursor-pointer appearance-none'
            >
              <option value='all'>Todas Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className='relative min-w-[160px] flex-1 sm:flex-none'>
            <CalendarDays className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400' />
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className='w-full bg-background border border-border-custom rounded-xl pl-10 pr-4 py-3 text-[11px] font-black uppercase tracking-tighter outline-none cursor-pointer appearance-none'
            >
              <option value='all'>Todos os Meses</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {new Date(m + '-02')
                    .toLocaleDateString('pt-BR', {
                      month: 'short',
                      year: 'numeric',
                    })
                    .toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABELA PRINCIPAL COM FIX DE OVERFLOW */}
      <div className='bg-surface border border-border-custom rounded-2xl shadow-sm overflow-visible relative z-10'>
        <div className='hidden md:block overflow-visible'>
          <table className='w-full text-sm text-left border-separate border-spacing-0'>
            <thead className='bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 sticky top-0 z-20'>
              <tr>
                <th className='px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b border-border-custom'>
                  Descrição
                </th>
                <th className='px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b border-border-custom'>
                  Categoria
                </th>
                <th className='px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b border-border-custom'>
                  Data Compra
                </th>
                <th className='px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b border-border-custom text-right'>
                  Valor
                </th>
                <th className='px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b border-border-custom text-center'>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className='overflow-visible'>
              {filteredTransactions.map((tx, index) => (
                <tr
                  key={tx.id}
                  className='group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors overflow-visible'
                >
                  <td className='px-6 py-4 border-b border-border-custom'>
                    <div className='flex items-center gap-3'>
                      <div
                        className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowDownLeft className='w-4 h-4 text-emerald-600' />
                        ) : (
                          <ArrowUpRight className='w-4 h-4 text-rose-600' />
                        )}
                      </div>
                      <span className='font-bold text-foreground'>
                        {tx.description}
                      </span>
                    </div>
                  </td>
                  <td className='px-6 py-4 uppercase border-b border-border-custom'>
                    <span
                      className='px-2 py-0.5 rounded-md text-[10px] font-black border'
                      style={{
                        backgroundColor: `${tx.category?.color}15`,
                        borderColor: `${tx.category?.color}30`,
                        color: tx.category?.color,
                      }}
                    >
                      {tx.category?.name || 'Geral'}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-zinc-500 font-bold text-xs uppercase border-b border-border-custom'>
                    {new Date(tx.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-black border-b border-border-custom ${tx.type === 'income' ? 'text-emerald-600' : 'text-foreground'}`}
                  >
                    {tx.type === 'expense'
                      ? `- ${formatMoney(tx.amount)}`
                      : formatMoney(tx.amount)}
                  </td>
                  <td className='px-6 py-4 text-center border-b border-border-custom overflow-visible'>
                    <TransactionRowActions
                      transactionId={tx.id}
                      onEdit={() => handleEdit(tx)}
                      isLast={index === filteredTransactions.length - 1}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW */}
        <div className='md:hidden divide-y divide-border-custom overflow-visible'>
          {filteredTransactions.map((tx, index) => (
            <div
              key={tx.id}
              className='p-4 space-y-4 overflow-visible relative'
            >
              <div className='flex justify-between items-start overflow-visible'>
                <div className='flex items-center gap-3'>
                  <div
                    className={`p-2.5 rounded-xl ${tx.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowDownLeft className='w-4 h-4 text-emerald-600' />
                    ) : (
                      <ArrowUpRight className='w-4 h-4 text-rose-600' />
                    )}
                  </div>
                  <div>
                    <p className='font-bold text-foreground text-sm'>
                      {tx.description}
                    </p>
                    <p className='text-[10px] font-bold text-zinc-500 uppercase'>
                      {new Date(tx.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <TransactionRowActions
                  transactionId={tx.id}
                  onEdit={() => handleEdit(tx)}
                  isLast={index === filteredTransactions.length - 1}
                />
              </div>
              <div className='flex justify-between items-center'>
                <span
                  className='px-2 py-0.5 rounded text-[10px] font-black border uppercase'
                  style={{
                    color: tx.category?.color,
                    borderColor: `${tx.category?.color}40`,
                    backgroundColor: `${tx.category?.color}10`,
                  }}
                >
                  {tx.category?.name || 'Geral'}
                </span>
                <span
                  className={`text-sm font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-foreground'}`}
                >
                  {tx.type === 'expense'
                    ? `- ${formatMoney(tx.amount)}`
                    : formatMoney(tx.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className='p-16 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest opacity-50 italic'>
            Nenhuma transação corresponde aos filtros.
          </div>
        )}
      </div>
    </div>
  );
}
