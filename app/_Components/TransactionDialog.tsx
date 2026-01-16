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
import { createTransaction } from '../_actions/transactions';
import { getCategories } from '../_actions/categories'; // Importando a busca de categorias

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionDialog({
  isOpen,
  onClose,
}: TransactionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<'income' | 'expense'>('expense');

  // Estados do Formulário
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Estado para armazenar as categorias do banco
  const [dbCategories, setDbCategories] = useState<{ name: string }[]>([]);

  // Categorias padrão sugeridas (Fallback)
  const defaultCategories = ['Alimentação', 'Lazer', 'Transporte', 'Saúde'];

  // Carrega categorias do usuário ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      async function load() {
        const data = await getCategories();
        setDbCategories(data);
      }
      load();
    }
  }, [isOpen]);

  // Merge das categorias (Set remove duplicatas)
  const allCategories = Array.from(
    new Set([...defaultCategories, ...dbCategories.map((c) => c.name)])
  ).sort();

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!amount || !description || !category) {
      alert('Preencha todos os campos!');
      return;
    }

    startTransition(async () => {
      const result = await createTransaction({
        amount: parseFloat(amount),
        description,
        category,
        date,
        type,
      });

      if (result.success) {
        onClose();
        setAmount('');
        setDescription('');
        setCategory('');
      } else {
        alert('Erro ao salvar!');
      }
    });
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
      <div className='w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]'>
        <div className='flex justify-between items-center p-6 border-b border-zinc-800'>
          <h2 className='text-lg font-bold text-white'>Nova Transação</h2>
          <button
            onClick={onClose}
            className='text-zinc-500 hover:text-white transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='p-6 overflow-y-auto custom-scrollbar'>
          <form
            className='space-y-6'
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {/* TIPO */}
            <div className='grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-lg border border-zinc-800'>
              <button
                type='button'
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                  type === 'income'
                    ? 'bg-zinc-800 text-emerald-500 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <ArrowUpCircle className='w-4 h-4' /> Receita
              </button>
              <button
                type='button'
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                  type === 'expense'
                    ? 'bg-zinc-800 text-rose-500 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <ArrowDownCircle className='w-4 h-4' /> Despesa
              </button>
            </div>

            {/* VALOR */}
            <div className='space-y-2'>
              <label className='text-xs font-medium text-zinc-400'>Valor</label>
              <div className='relative'>
                <div className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500'>
                  <DollarSign className='w-4 h-4' />
                </div>
                <input
                  type='number'
                  step='0.01'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder='0,00'
                  className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-lg font-bold outline-none transition-all placeholder:text-zinc-600 ${
                    type === 'income'
                      ? 'text-emerald-500 focus:border-emerald-500/50'
                      : 'text-rose-500 focus:border-rose-500/50'
                  }`}
                />
              </div>
            </div>

            {/* DESCRIÇÃO */}
            <div className='space-y-2'>
              <label className='text-xs font-medium text-zinc-400'>
                Descrição
              </label>
              <div className='relative'>
                <div className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500'>
                  <FileText className='w-4 h-4' />
                </div>
                <input
                  type='text'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Ex: Almoço, Freelance...'
                  className='w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-zinc-700 outline-none transition-all placeholder:text-zinc-600'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              {/* CATEGORIA DINÂMICA */}
              <div className='space-y-2'>
                <label className='text-xs font-medium text-zinc-400'>
                  Categoria
                </label>
                <div className='relative'>
                  <div className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500'>
                    <Tag className='w-4 h-4' />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className='w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-300 focus:border-zinc-700 outline-none appearance-none cursor-pointer'
                  >
                    <option value='' disabled>
                      Selecione...
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
                <label className='text-xs font-medium text-zinc-400'>
                  Data
                </label>
                <div className='relative'>
                  <div className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500'>
                    <Calendar className='w-4 h-4' />
                  </div>
                  <input
                    type='date'
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className='w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-300 focus:border-zinc-700 outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert'
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className='p-6 border-t border-zinc-800 flex gap-3 bg-zinc-950 rounded-b-xl'>
          <button
            type='button'
            onClick={onClose}
            disabled={isPending}
            className='flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-50'
          >
            Cancelar
          </button>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={isPending}
            className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-all shadow-lg flex items-center justify-center gap-2 ${
              type === 'income'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'
            } ${isPending ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isPending ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' /> Salvando...
              </>
            ) : type === 'income' ? (
              'Receber Valor'
            ) : (
              'Pagar Valor'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
