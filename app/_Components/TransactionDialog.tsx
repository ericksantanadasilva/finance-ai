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

        // TRATAMENTO DE DATA NA EDIÇÃO (Evita retroceder 1 dia)
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
      alert('Preencha todos os campos!');
      return;
    }

    startTransition(async () => {
      const payload = {
        amount: parseFloat(amount),
        description,
        category,
        // BLINDAGEM DE FUSO: Forçamos o meio-dia para o banco não subtrair o dia
        date: `${date}T12:00:00`,
        type,
      };

      const result = editData
        ? await updateTransaction(editData.id, payload)
        : await createTransaction(payload);

      if (result.success) {
        onClose();
      } else {
        alert('Erro ao salvar!');
      }
    });
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
      <div className='w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]'>
        <div className='flex justify-between items-center p-6 border-b border-zinc-800'>
          <h2 className='text-lg font-bold text-white'>
            {editData ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button
            onClick={onClose}
            className='text-zinc-500 hover:text-white transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='p-6 overflow-y-auto custom-scrollbar'>
          <form className='space-y-6' onSubmit={(e) => e.preventDefault()}>
            <div className='grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-lg border border-zinc-800'>
              <button
                type='button'
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${type === 'income' ? 'bg-zinc-800 text-emerald-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <ArrowUpCircle className='w-4 h-4' /> Receita
              </button>
              <button
                type='button'
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${type === 'expense' ? 'bg-zinc-800 text-rose-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <ArrowDownCircle className='w-4 h-4' /> Despesa
              </button>
            </div>

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
                  className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-lg font-bold outline-none transition-all ${type === 'income' ? 'text-emerald-500 focus:border-emerald-500/50' : 'text-rose-500 focus:border-rose-500/50'}`}
                />
              </div>
            </div>

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
                  className='w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-zinc-700 outline-none'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
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
                    className='w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-300 focus:border-emerald-500/50 outline-none transition-all [&::-webkit-calendar-picker-indicator]:invert'
                  />
                </div>
              </div>
            </div>

            <div className='pt-4 flex gap-3'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 py-3 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-medium text-zinc-400 hover:text-white transition-all'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={handleSubmit}
                disabled={isPending}
                className='flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2'
              >
                {isPending ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
