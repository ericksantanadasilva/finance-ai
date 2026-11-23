'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Clock,
  Check,
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
import type { TransactionItem } from '@/lib/finance/transactions';
import { currentMonthISO, formatDateOnly } from '@/app/utils/dates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatCard } from './StatCard';
import CategoryBadge from './CategoryBadge';
import TypeIcon from './TypeIcon';

type PageData = {
  items: TransactionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totals: {
    income: number;
    expense: number;
    carryOver: number; // só o pago dos meses anteriores
    balance: number; // só o pago: carryOver + recebido − pago no conjunto
  };
  categories: string[];
  months: string[];
};

export default function TransactionsClient({
  data,
  currentMonth,
}: {
  data: PageData;
  currentMonth: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const categoryFilter = searchParams.get('category') ?? 'all';
  const monthFilter = searchParams.get('month') ?? currentMonth;
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
  // O mês atual aparece no select mesmo antes do primeiro lançamento dele
  const availableMonths = Array.from(new Set([currentMonth, ...data.months]))
    .sort()
    .reverse();
  const filteredTransactions = data.items;

  // Sobra positiva conta como receita; se os meses anteriores fecharam negativos, como despesa
  const carryOver = data.totals.carryOver;
  const incomeTotal = data.totals.income + Math.max(carryOver, 0);
  const expenseTotal = data.totals.expense + Math.max(-carryOver, 0);

  // Atualiza a URL (fonte da verdade dos filtros). Qualquer filtro volta para a página 1.
  const updateParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      // Mês fica na URL mesmo em "all", porque sem ele a tela abre no mês atual
      if (key !== 'month' && (value === null || value === '' || value === 'all'))
        params.delete(key);
      else if (value) params.set(key, value);
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
    monthFilter !== currentMonth ||
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
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-10 lg:pt-0'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold lowercase'>
            Transações
          </h1>
          <p className='text-muted-foreground text-xs sm:text-sm font-medium'>
            Consulte e filtre seu histórico financeiro completo.
          </p>
        </div>
        <Button onClick={handleNew} className='w-full sm:w-auto'>
          <Plus className='w-4 h-4' /> Nova Transação
        </Button>
      </div>

      {/* BARRA DE FILTROS */}
      <Card className='p-4 mb-6 flex flex-col gap-4'>
        <div className='flex flex-col lg:flex-row gap-4'>
          <div className='relative flex-1'>
            <Search className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              type='text'
              aria-label='Buscar transação'
              placeholder='Buscar transação...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-12'
            />
          </div>

          <div className='flex flex-wrap sm:flex-nowrap gap-4'>
            <div className='relative min-w-40 flex-1 sm:flex-none'>
              <Filter className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground' />
              <Select
                value={categoryFilter}
                onValueChange={(v) => updateParams({ category: v })}
              >
                <SelectTrigger
                  aria-label='Filtrar por categoria'
                  className='pl-10 text-xs font-bold'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>todas categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='relative min-w-40 flex-1 sm:flex-none'>
              <CalendarDays className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground' />
              <Select
                value={monthFilter}
                onValueChange={(v) => updateParams({ month: v })}
              >
                <SelectTrigger
                  aria-label='Filtrar por mês'
                  className='pl-10 text-xs font-bold'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>todos os meses</SelectItem>
                  {availableMonths.map((m) => (
                    <SelectItem key={m} value={m}>
                      {new Date(m + '-02').toLocaleDateString('pt-BR', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className='flex flex-col lg:flex-row gap-4 lg:items-center lg:flex-wrap'>
          {/* Chips: o ativo é adesivo; os outros, planos. Ícone + texto,
              a cor (receita/despesa) só reforça */}
          <div role='group' aria-label='Tipo' className='flex flex-wrap gap-2'>
            {TYPE_OPTIONS.map((opt) => {
              const active = typeFilter === opt.value;
              return (
                <Button
                  key={opt.value}
                  size='sm'
                  variant={active ? opt.activeVariant : 'outline'}
                  aria-pressed={active}
                  onClick={() => updateParams({ type: opt.value })}
                >
                  {opt.Icon && <opt.Icon className='w-3.5 h-3.5' />}
                  {opt.label}
                </Button>
              );
            })}
          </div>

          <div role='group' aria-label='Status' className='flex flex-wrap gap-2'>
            {STATUS_OPTIONS.map((opt) => {
              const active = statusFilter === opt.value;
              return (
                <Button
                  key={opt.value}
                  size='sm'
                  variant={active ? 'default' : 'outline'}
                  aria-pressed={active}
                  onClick={() => updateParams({ status: opt.value })}
                >
                  {opt.Icon && <opt.Icon className='w-3.5 h-3.5' />}
                  {opt.label}
                </Button>
              );
            })}
          </div>

          <div className='flex gap-2 items-center'>
            <Input
              type='number'
              inputMode='decimal'
              min='0'
              step='0.01'
              aria-label='Valor mínimo'
              placeholder='Valor mín.'
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className='w-28 h-9 px-3 text-xs'
            />
            <span className='text-muted-foreground text-xs'>até</span>
            <Input
              type='number'
              inputMode='decimal'
              min='0'
              step='0.01'
              aria-label='Valor máximo'
              placeholder='Valor máx.'
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className='w-28 h-9 px-3 text-xs'
            />
          </div>

          <div className='relative min-w-45 lg:ml-auto'>
            <ArrowUpDown className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground' />
            <Select
              value={sortFilter}
              onValueChange={(v) => updateParams({ sort: v })}
            >
              <SelectTrigger
                size='sm'
                aria-label='Ordenar'
                className='h-9 pl-10 font-bold'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='date_desc'>mais recentes</SelectItem>
                <SelectItem value='date_asc'>mais antigas</SelectItem>
                <SelectItem value='amount_desc'>maior valor</SelectItem>
                <SelectItem value='amount_asc'>menor valor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant='ghost'
              size='sm'
              onClick={clearFilters}
              className='self-start lg:self-auto text-muted-foreground hover:text-foreground'
            >
              <X className='w-3.5 h-3.5' /> Limpar filtros
            </Button>
          )}
        </div>
      </Card>

      {/* RESUMO DO CONJUNTO FILTRADO */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6'>
        <StatCard
          label='Receitas'
          icon={ArrowUpCircle}
          value={formatMoney(incomeTotal)}
          tone='income'
          note={
            carryOver > 0
              ? `${formatMoney(carryOver)} do mês anterior`
              : undefined
          }
        />
        <StatCard
          label='Despesas'
          icon={ArrowDownCircle}
          value={formatMoney(expenseTotal)}
          tone='expense'
          note={
            carryOver < 0
              ? `${formatMoney(-carryOver)} do mês anterior`
              : undefined
          }
        />
        <StatCard
          label='Saldo'
          icon={Wallet}
          value={formatMoney(data.totals.balance)}
          note='Conta só o que foi pago'
        />
      </div>

      {/* TABELA PRINCIPAL (sem overflow-hidden, para o menu "…" não ser cortado) */}
      <Card
        className={`relative z-10 transition-opacity ${isPending ? 'opacity-60' : 'opacity-100'}`}
      >
        <div className='hidden md:block'>
          <table className='w-full text-sm text-left border-separate border-spacing-0'>
            <thead className='bg-band text-band-foreground'>
              <tr>
                {/* Primeira e última célula arredondam junto com o card */}
                <th className={`${thClass} rounded-tl-[calc(var(--radius-2xl)-2px)]`}>
                  Descrição
                </th>
                <th className={thClass}>Categoria</th>
                <th className={thClass}>Data Compra</th>
                <th className={`${thClass} text-right`}>Valor</th>
                <th
                  className={`${thClass} text-center rounded-tr-[calc(var(--radius-2xl)-2px)]`}
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, index) => (
                <tr
                  key={tx.id}
                  className='hover:bg-surface-muted/60 transition-colors'
                >
                  <td className='px-6 py-4 border-b border-border-custom'>
                    <div className='flex items-center gap-3'>
                      <TypeIcon type={tx.type} />
                      <div className='flex flex-col gap-1 min-w-0'>
                        <span className='font-bold text-foreground wrap-break-word'>
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
                  <td className='px-6 py-4 border-b border-border-custom'>
                    <CategoryBadge
                      name={tx.category?.name}
                      color={tx.category?.color}
                    />
                  </td>
                  <td className='px-6 py-4 text-muted-foreground font-medium text-xs tabular-nums whitespace-nowrap border-b border-border-custom'>
                    {formatDateOnly(tx.date)}
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-bold tabular-nums whitespace-nowrap border-b border-border-custom ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}
                  >
                    {tx.type === 'expense'
                      ? `- ${formatMoney(tx.amount)}`
                      : formatMoney(tx.amount)}
                  </td>
                  <td className='px-6 py-4 text-center border-b border-border-custom'>
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
        <div className='md:hidden divide-y divide-border-custom'>
          {filteredTransactions.map((tx, index) => (
            <div key={tx.id} className='p-4 space-y-4 relative'>
              <div className='flex justify-between items-start gap-3'>
                <div className='flex items-center gap-3 min-w-0'>
                  <TypeIcon type={tx.type} />
                  <div className='min-w-0'>
                    <p className='font-bold text-foreground text-sm wrap-break-word'>
                      {tx.description}
                    </p>
                    <p className='text-xs font-medium text-muted-foreground tabular-nums'>
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
              <div className='flex justify-between items-center gap-3'>
                <div className='flex min-w-0'>
                  <CategoryBadge
                    name={tx.category?.name}
                    color={tx.category?.color}
                  />
                </div>
                <span
                  className={`text-sm font-bold tabular-nums whitespace-nowrap ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}
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
          <div className='p-16 text-center text-muted-foreground text-sm font-medium'>
            Nenhuma transação corresponde aos filtros.
          </div>
        )}

        {/* PAGINAÇÃO */}
        {data.total > 0 && (
          <div className='flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-border-custom'>
            <p className='text-xs font-medium text-muted-foreground tabular-nums'>
              {(data.page - 1) * data.pageSize + 1}–
              {Math.min(data.page * data.pageSize, data.total)} de {data.total}
            </p>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='icon'
                disabled={data.page <= 1 || isPending}
                onClick={() => updateParams({ page: String(data.page - 1) })}
                aria-label='Página anterior'
                className='size-9'
              >
                <ChevronLeft className='w-4 h-4' />
              </Button>
              <span className='text-xs font-bold tabular-nums'>
                {data.page} / {data.totalPages}
              </span>
              <Button
                variant='outline'
                size='icon'
                disabled={data.page >= data.totalPages || isPending}
                onClick={() => updateParams({ page: String(data.page + 1) })}
                aria-label='Próxima página'
                className='size-9'
              >
                <ChevronRight className='w-4 h-4' />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

const thClass =
  'px-6 py-3 text-xs font-bold lowercase border-b-2 border-ink whitespace-nowrap';

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todas', Icon: null, activeVariant: 'default' },
  {
    value: 'income',
    label: 'Receitas',
    Icon: ArrowUp,
    activeVariant: 'income',
  },
  {
    value: 'expense',
    label: 'Despesas',
    Icon: ArrowDown,
    activeVariant: 'expense',
  },
] as const;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Qualquer status', Icon: null },
  { value: 'pending', label: 'Pendentes', Icon: Clock },
  { value: 'paid', label: 'Pagas', Icon: Check },
] as const;
