'use client';

import React, { useState, useTransition, useEffect } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
} from 'lucide-react';
import { createTransaction, updateTransaction } from '../_actions/transactions';
import { getCategories } from '../_actions/categories';
import { toast } from 'sonner';

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: any;
}

export default function TransactionDialog({
  isOpen,
  onClose,
  editData,
}: TransactionDialogProps) {
  const [isPending, startTransition] = useTransition();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [dbCategories, setDbCategories] = useState<{ name: string }[]>([]);
  const defaultCategories = ['Alimentação', 'Lazer', 'Transporte', 'Saúde'];

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setType(editData.type === 'income' ? 'income' : 'expense');
        setAmount(editData.amount.toString());
        setDescription(editData.description);
        setCategory(editData.category?.name || '');

        const d = new Date(editData.date);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
      } else {
        setType('expense');
        setAmount('');
        setDescription('');
        setCategory('');
        setDate(new Date().toISOString().split('T')[0]);
      }

      async function load() {
        const data = await getCategories();
        setDbCategories(data);
      }
      load();
    }
  }, [isOpen, editData]);

  const allCategories = Array.from(
    new Set([...defaultCategories, ...dbCategories.map((c) => c.name)]),
  ).sort();

  if (!isOpen) return null;

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

      const result = editData
        ? await updateTransaction(editData.id, payload)
        : await createTransaction(payload);

      if (result.success) {
        onClose();
      } else {
        toast.error('Erro ao salvar!');
      }
    });
  }

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300'>
      <div className='w-full max-w-md bg-surface border border-border-custom rounded-2xl shadow-2xl relative animate-in zoom-in duration-200 flex flex-col max-h-[90vh]'>
        {/* HEADER */}
        <div className='flex justify-between items-center p-6 border-b border-border-custom'>
          <h2 className='text-lg font-black text-foreground'>
            {editData ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button
            onClick={onClose}
            className='text-zinc-400 hover:text-foreground transition-colors p-1'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='p-6 overflow-y-auto custom-scrollbar'>
          <form className='space-y-6' onSubmit={(e) => e.preventDefault()}>
            {/* SELETOR DE TIPO (TROCA DE COR DINÂMICA) */}
            <div className='grid grid-cols-2 gap-2 p-1.5 bg-background border border-border-custom rounded-xl'>
              <button
                type='button'
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  type === 'income'
                    ? 'bg-surface text-emerald-600 dark:text-emerald-500 shadow-sm border border-border-custom scale-[1.02]'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <ArrowUpCircle
                  className={`w-4 h-4 ${type === 'income' ? 'text-emerald-600' : ''}`}
                />
                RECEITA
              </button>
              <button
                type='button'
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  type === 'expense'
                    ? 'bg-surface text-rose-600 dark:text-rose-500 shadow-sm border border-border-custom scale-[1.02]'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <ArrowDownCircle
                  className={`w-4 h-4 ${type === 'expense' ? 'text-rose-600' : ''}`}
                />
                DESPESA
              </button>
            </div>

            {/* INPUT VALOR (TROCA DE COR DINÂMICA) */}
            <div className='space-y-2'>
              <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                Valor
              </label>
              <div className='relative'>
                {/* Símbolo R$ - Cor via Style para garantir prioridade */}
                <div
                  className='absolute left-4 top-1/2 -translate-y-1/2 font-bold transition-colors duration-200 z-10'
                  style={{
                    color:
                      type === 'income'
                        ? 'var(--color-emerald-600, #10b981)'
                        : 'var(--color-rose-600, #e11d48)',
                  }}
                >
                  R$
                </div>

                <input
                  type='number'
                  step='0.01'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder='0,00'
                  /* Mantemos o style para o número digitado */
                  style={{ color: type === 'income' ? '#059669' : '#e11d48' }}
                  className={`w-full bg-background border border-border-custom rounded-xl pl-12 pr-4 py-4 text-2xl font-black outline-none transition-all duration-200 focus:ring-2 ${
                    type === 'income'
                      ? 'focus:border-emerald-500/50 focus:ring-emerald-500/10 placeholder:text-emerald-600/50'
                      : 'focus:border-rose-500/50 focus:ring-rose-500/10 placeholder:text-rose-600/50'
                  }`}
                />
              </div>
            </div>

            {/* DESCRIÇÃO */}
            <div className='space-y-2'>
              <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                Descrição
              </label>
              <div className='relative'>
                <div className='absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400'>
                  <FileText className='w-4 h-4' />
                </div>
                <input
                  type='text'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Ex: Supermercado...'
                  className='w-full bg-background border border-border-custom rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-foreground outline-none focus:border-primary/30 transition-all'
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
                  <div className='absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400'>
                    <Tag className='w-4 h-4' />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className='w-full bg-background border border-border-custom rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold text-foreground outline-none appearance-none cursor-pointer focus:border-primary/30'
                  >
                    <option value='' disabled>
                      Filtrar...
                    </option>
                    {allCategories.map((catName) => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DATA */}
              <div className='space-y-2'>
                <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                  Data
                </label>
                <div className='relative'>
                  <div className='absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400'>
                    <Calendar className='w-4 h-4' />
                  </div>
                  <input
                    type='date'
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className='w-full bg-background border border-border-custom rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold text-foreground outline-none focus:border-primary/30 transition-all dark:[&::-webkit-calendar-picker-indicator]:invert'
                  />
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className='pt-6 flex gap-3'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 py-4 px-4 bg-background border border-border-custom rounded-xl text-xs font-bold text-zinc-500 hover:text-foreground transition-all active:scale-95'
              >
                CANCELAR
              </button>
              <button
                type='button'
                onClick={handleSubmit}
                disabled={isPending}
                className={`flex-1 py-4 px-4 text-white rounded-xl text-xs font-black tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 ${
                  type === 'income'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                }`}
              >
                {isPending ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  'SALVAR'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
