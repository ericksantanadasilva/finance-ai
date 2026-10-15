'use client';

import React, { useState, useTransition, useEffect } from 'react';
import {
  X,
  Calendar,
  Tag,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { createTransaction, updateTransaction } from '../_actions/transactions';
import { getCategories, type BudgetStatus } from '../_actions/categories';
import { toast } from 'sonner';
import { todayISO } from '@/app/utils/dates';

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: any;
  referenceMonth: string; // Mês vindo do Dashboard ou Filtro
}

export default function TransactionDialog({
  isOpen,
  onClose,
  editData,
  referenceMonth,
}: TransactionDialogProps) {
  const [isPending, startTransition] = useTransition();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(todayISO());

  // NOVO: Estado para controlar o Mês de Competência dentro do modal
  const [selectedReference, setSelectedReference] = useState(referenceMonth);

  const [dbCategories, setDbCategories] = useState<{ name: string }[]>([]);
  const defaultCategories = ['Alimentação', 'Lazer', 'Transporte', 'Saúde'];

  // Gera opções de meses para o seletor de competência (3 meses atrás até 6 meses à frente)
  const referenceOptions = React.useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = -3; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });
      options.push({
        value,
        label: label.charAt(0).toUpperCase() + label.slice(1),
      });
    }
    return options;
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setType(editData.type === 'income' ? 'income' : 'expense');
        setAmount(editData.amount.toString());
        setDescription(editData.description);
        setCategory(editData.category?.name || '');

        // Se for edição, pega o referenceDate real do banco de dados
        if (editData.referenceDate) {
          setSelectedReference(
            new Date(editData.referenceDate).toISOString().slice(0, 7),
          );
        }

        const d = new Date(editData.date);
        setDate(d.toISOString().split('T')[0]);
      } else {
        setType('expense');
        setAmount('');
        setDescription('');
        setCategory('');
        setDate(todayISO());
        // Se for novo, usa o que veio do Dashboard (ex: 2026-02)
        setSelectedReference(referenceMonth);
      }

      async function load() {
        const data = await getCategories();
        setDbCategories(data);
      }
      load();
    }
  }, [isOpen, editData, referenceMonth]);

  const allCategories = Array.from(
    new Set([...defaultCategories, ...dbCategories.map((c) => c.name)]),
  ).sort();

  async function handleSubmit() {
    if (!amount || !description || !category) {
      toast.warning('Preencha todos os campos!');
      return;
    }

    startTransition(async () => {
      const payload = {
        amount: parseFloat(amount),
        description,
        category,
        date: `${date}T12:00:00`,
        type,
      };

      // Enviamos o selectedReference que o usuário escolheu no Modal
      const result = editData
        ? await updateTransaction(editData.id, payload, selectedReference)
        : await createTransaction(payload, selectedReference);

      if (result.success) {
        toast.success('Sucesso!');
        const a = (result as { budgetAlert?: BudgetStatus | null })
          .budgetAlert;
        if (a) {
          const fmt = (v: number) =>
            v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const msg =
            a.percent >= 100
              ? `Orçamento de ${a.category} estourado: ${fmt(a.spent)} de ${fmt(a.budget)}.`
              : `${a.category}: ${Math.round(a.percent)}% do orçamento usado (${fmt(a.spent)} de ${fmt(a.budget)}).`;
          toast.warning(msg);
        }
        onClose();
      } else {
        toast.error('Erro ao salvar!');
      }
    });
  }

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
      <div className='w-full max-w-md bg-surface border border-border-custom rounded-2xl shadow-2xl flex flex-col max-h-[90vh]'>
        {/* HEADER */}
        <div className='flex justify-between items-center p-6 border-b border-border-custom'>
          <h2 className='text-lg font-black text-foreground uppercase tracking-tight'>
            {editData ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button
            onClick={onClose}
            className='text-zinc-400 hover:text-foreground transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='p-6 overflow-y-auto custom-scrollbar space-y-6'>
          {/* TIPO */}
          <div className='grid grid-cols-2 gap-2 p-1.5 bg-background border border-border-custom rounded-xl'>
            <button
              type='button'
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                type === 'income'
                  ? 'bg-surface text-emerald-600 shadow-sm border border-border-custom'
                  : 'text-zinc-500'
              }`}
            >
              <ArrowUpCircle className='w-4 h-4' /> RECEITA
            </button>
            <button
              type='button'
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                type === 'expense'
                  ? 'bg-surface text-rose-600 shadow-sm border border-border-custom'
                  : 'text-zinc-500'
              }`}
            >
              <ArrowDownCircle className='w-4 h-4' /> DESPESA
            </button>
          </div>

          {/* VALOR */}
          <div className='space-y-2'>
            <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
              Valor
            </label>
            <div className='relative'>
              <span className='absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400'>
                R$
              </span>
              <input
                type='number'
                step='0.01'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ color: type === 'income' ? '#10b981' : '#e11d48' }}
                className='w-full bg-background border border-border-custom rounded-xl pl-12 pr-4 py-4 text-2xl font-black outline-none focus:ring-2 focus:ring-emerald-500/10'
              />
            </div>
          </div>

          {/* SELETOR DE COMPETÊNCIA (O MÊS QUE APARECE NO DASHBOARD) */}
          <div className='p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-3'>
            <div className='flex items-center gap-2 text-emerald-600 dark:text-emerald-500'>
              <Clock className='w-4 h-4' />
              <label className='text-[10px] font-black uppercase tracking-widest'>
                Mês de Competência
              </label>
            </div>
            <select
              value={selectedReference}
              onChange={(e) => setSelectedReference(e.target.value)}
              className='w-full bg-surface border border-border-custom rounded-lg px-3 py-2 text-xs font-bold outline-none cursor-pointer'
            >
              {referenceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className='text-[9px] text-zinc-500 font-medium'>
              * Este é o mês onde este valor será somado nos gráficos.
            </p>
          </div>

          <div className='space-y-4'>
            {/* DESCRIÇÃO */}
            <div className='space-y-2'>
              <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                Descrição
              </label>
              <div className='relative'>
                <FileText className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
                <input
                  type='text'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className='w-full bg-background border border-border-custom rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              {/* CATEGORIA */}
              <div className='space-y-2'>
                <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                  Categoria
                </label>
                <div className='relative'>
                  <Tag className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className='w-full bg-background border border-border-custom rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold outline-none appearance-none'
                  >
                    <option value='' disabled>
                      Selecionar...
                    </option>
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DATA REAL */}
              <div className='space-y-2'>
                <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                  Data da Compra
                </label>
                <div className='relative'>
                  <Calendar className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
                  <input
                    type='date'
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className='w-full bg-background border border-border-custom rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold outline-none'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className='pt-4 flex gap-3'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 py-4 bg-background border border-border-custom rounded-xl text-xs font-bold text-zinc-500'
            >
              CANCELAR
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className={`flex-1 py-4 text-white rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 ${
                type === 'income' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              {isPending ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                'SALVAR'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
