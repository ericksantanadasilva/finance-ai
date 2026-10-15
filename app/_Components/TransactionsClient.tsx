'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  CalendarDays,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { TransactionRowActions } from './TransactionRowActions';
import TransactionDialog from '../_Components/TransactionDialog';
import TransactionStatus from './TransactionStatus';
import type { TransactionItem } from '@/app/_actions/transactions';
import { currentMonthISO, formatDateOnly } from '@/app/utils/dates';

type PageData = {
  items: TransactionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totals: { income: number; expense: number };
  categories: string[];
  months: string[];
};

export default function TransactionsClient({ data }: { data: PageData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const categoryFilter = searchParams.get('category') ?? 'all';
  const monthFilter = searchParams.get('month') ?? 'all';
  const typeFilter = searchParams.get('type') ?? 'all';
  const statusFilter = searchParams.get('status') ?? 'all';
  const sortFilter = searchParams.get('sort') ?? 'date_desc';
  const urlSearch = searchParams.get('q') ?? '';

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [minAmount, setMinAmount] = useState(searchParams.get('min') ?? '');
  const [maxAmount, setMaxAmount] = useState(searchParams.get('max') ?? '');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const categories = data.categories;
  const availableMonths = data.months;
  const filteredTransactions = data.items;

  // Atualiza a URL (fonte da verdade dos filtros). Qualquer filtro volta para a página 1.
  const updateParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') params.delete(key);
      else params.set(key, value);
    });
    if (!('page' in patch)) params.delete('page');
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  // Debounce para busca por texto e faixa de valor (evita uma consulta por tecla)
  useEffect(() => {
    const current = {
      q: urlSearch,
      min: searchParams.get('min') ?? '',
      max: searchParams.get('max') ?? '',
    };
    if (
      searchTerm === current.q &&
      minAmount === current.min &&
      maxAmount === current.max
    )
      return;
    const t = setTimeout(() => {
      updateParams({ q: searchTerm, min: minAmount, max: maxAmount });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, minAmount, maxAmount]);

  const hasActiveFilters =
    !!urlSearch ||
    categoryFilter !== 'all' ||
    monthFilter !== 'all' ||
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    !!searchParams.get('min') ||
    !!searchParams.get('max');

  const clearFilters = () => {
    setSearchTerm('');
    setMinAmount('');
    setMaxAmount('');
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

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
            ? currentMonthISO()
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
      <div className='bg-surface border border-border-custom rounded-2xl p-4 shadow-sm mb-6 flex flex-col gap-4'>
        <div className='flex flex-col lg:flex-row gap-4'>
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
                onChange={(e) => updateParams({ category: e.target.value })}
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
                onChange={(e) => updateParams({ month: e.target.value })}
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

        <div className='flex flex-col lg:flex-row gap-4 lg:items-center'>
          <div className='flex gap-2'>
            {[
              { value: 'all', label: 'Todas' },
              { value: 'income', label: 'Receitas' },
              { value: 'expense', label: 'Despesas' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParams({ type: opt.value })}
                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tighter border transition-all ${
                  typeFilter === opt.value
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-background border-border-custom text-zinc-500 hover:border-emerald-500/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className='flex gap-2'>
            {[
              { value: 'all', label: 'Qualquer status' },
              { value: 'pending', label: 'Pendentes' },
              { value: 'paid', label: 'Pagas' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParams({ status: opt.value })}
                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tighter border transition-all ${
                  statusFilter === opt.value
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-background border-border-custom text-zinc-500 hover:border-amber-500/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className='flex gap-2 items-center'>
            <input
              type='number'
              inputMode='decimal'
              min='0'
              step='0.01'
              placeholder='Valor mín.'
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className='w-28 bg-background border border-border-custom rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500/50'
            />
            <span className='text-zinc-400 text-xs'>até</span>
            <input
              type='number'
              inputMode='decimal'
              min='0'
              step='0.01'
              placeholder='Valor máx.'
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className='w-28 bg-background border border-border-custom rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500/50'
            />
          </div>

          <div className='relative min-w-[180px] lg:ml-auto'>
            <ArrowUpDown className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400' />
            <select
              value={sortFilter}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className='w-full bg-background border border-border-custom rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-black uppercase tracking-tighter outline-none cursor-pointer appearance-none'
            >
              <option value='date_desc'>Mais recentes</option>
              <option value='date_asc'>Mais antigas</option>
              <option value='amount_desc'>Maior valor</option>
              <option value='amount_asc'>Menor valor</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className='flex items-center gap-1 text-[11px] font-black uppercase tracking-tighter text-rose-500 hover:text-rose-400 transition-colors'
            >
              <X className='w-3.5 h-3.5' /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* RESUMO DO CONJUNTO FILTRADO */}
      <div className='grid grid-cols-3 gap-3 mb-6'>
        <div className='bg-surface border border-border-custom rounded-2xl p-4'>
          <p className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
            Receitas
          </p>
          <p className='text-sm sm:text-lg font-black text-emerald-600'>
            {formatMoney(data.totals.income)}
          </p>
        </div>
        <div className='bg-surface border border-border-custom rounded-2xl p-4'>
          <p className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
            Despesas
          </p>
          <p className='text-sm sm:text-lg font-black text-rose-600'>
            {formatMoney(data.totals.expense)}
          </p>
        </div>
        <div className='bg-surface border border-border-custom rounded-2xl p-4'>
          <p className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
            Saldo
          </p>
          <p className='text-sm sm:text-lg font-black text-foreground'>
            {formatMoney(data.totals.income - data.totals.expense)}
          </p>
        </div>
      </div>

      {/* TABELA PRINCIPAL COM FIX DE OVERFLOW */}
      <div
        className={`bg-surface border border-border-custom rounded-2xl shadow-sm overflow-visible relative z-10 transition-opacity ${isPending ? 'opacity-60' : 'opacity-100'}`}
      >
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
                      <div className='flex flex-col gap-1'>
                        <span className='font-bold text-foreground'>
                          {tx.description}
                        </span>
                        <TransactionStatus
                          id={tx.id}
                          isPaid={tx.isPaid}
                          isRecurring={!!tx.recurringRuleId}
                          type={tx.type}
                        />
                      </div>
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
                    {formatDateOnly(tx.date)}
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
                      {formatDateOnly(tx.date)}
                    </p>
                    <div className='mt-1'>
                      <TransactionStatus
                        id={tx.id}
                        isPaid={tx.isPaid}
                        isRecurring={!!tx.recurringRuleId}
                        type={tx.type}
                      />
                    </div>
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

        {/* PAGINAÇÃO */}
        {data.total > 0 && (
          <div className='flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-border-custom'>
            <p className='text-[11px] font-bold uppercase tracking-tighter text-zinc-500'>
              {(data.page - 1) * data.pageSize + 1}–
              {Math.min(data.page * data.pageSize, data.total)} de {data.total}
            </p>
            <div className='flex items-center gap-2'>
              <button
                disabled={data.page <= 1 || isPending}
                onClick={() => updateParams({ page: String(data.page - 1) })}
                aria-label='Página anterior'
                className='p-2 rounded-xl border border-border-custom bg-background disabled:opacity-40 hover:border-emerald-500/50 transition-all'
              >
                <ChevronLeft className='w-4 h-4' />
              </button>
              <span className='text-[11px] font-black uppercase tracking-tighter'>
                {data.page} / {data.totalPages}
              </span>
              <button
                disabled={data.page >= data.totalPages || isPending}
                onClick={() => updateParams({ page: String(data.page + 1) })}
                aria-label='Próxima página'
                className='p-2 rounded-xl border border-border-custom bg-background disabled:opacity-40 hover:border-emerald-500/50 transition-all'
              >
                <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
