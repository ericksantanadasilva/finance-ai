'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { X, Target, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { createGoal, updateGoalAmount } from '../_actions/goals';
import { toast } from 'sonner';

interface GoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: any;
}

export default function GoalDialog({
  isOpen,
  onClose,
  editData,
}: GoalDialogProps) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setTargetAmount(editData.targetAmount.toString());
      setCurrentAmount(editData.currentAmount.toString());
      if (editData.deadline && editData.deadline !== 'Sem prazo') {
        const parts = editData.deadline.split('/');
        if (parts.length === 3) {
          setDeadline(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setDeadline('');
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!name || !targetAmount) {
      toast.warning('Nome e Valor Alvo são obrigatórios!');
      return;
    }

    startTransition(async () => {
      let result;
      if (editData) {
        result = await updateGoalAmount(editData.id, parseFloat(currentAmount));
      } else {
        result = await createGoal({
          name,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount || '0'),
          deadline: deadline || undefined,
        });
      }

      if (result.success) {
        onClose();
      } else {
        toast.error('Erro ao salvar meta!');
      }
    });
  }

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
      <div className='w-full max-w-md bg-surface border border-border-custom rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden'>
        {/* HEADER */}
        <div className='flex justify-between items-center p-6 border-b border-border-custom'>
          <h2 className='text-lg font-bold text-foreground flex items-center gap-2'>
            <div className='p-2 bg-emerald-500/10 rounded-lg'>
              <Target className='w-5 h-5 text-emerald-600 dark:text-emerald-500' />
            </div>
            {editData ? 'Editar Meta' : 'Nova Meta'}
          </h2>
          <button
            onClick={onClose}
            className='text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors p-1'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* FORMULÁRIO */}
        <div className='p-6 space-y-5'>
          <div className='space-y-2'>
            <label className='text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest'>
              Nome do Objetivo
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex: Viagem, Carro Novo...'
              className='w-full bg-background border border-border-custom rounded-xl px-4 py-3 text-sm text-foreground focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-500 shadow-sm'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest'>
                Valor Alvo
              </label>
              <div className='relative'>
                <DollarSign className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
                <input
                  type='number'
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder='0,00'
                  className='w-full bg-background border border-border-custom rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:border-emerald-500 outline-none transition-all shadow-sm'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest'>
                Guardado (R$)
              </label>
              <div className='relative'>
                <DollarSign className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50' />
                <input
                  type='number'
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className='w-full bg-background border border-emerald-500/20 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:border-emerald-500 outline-none transition-all shadow-sm'
                />
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest'>
              Prazo Final (Opcional)
            </label>
            <div className='relative'>
              <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
              <input
                type='date'
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className='w-full bg-background border border-border-custom rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:border-emerald-500 outline-none transition-all dark:[&::-webkit-calendar-picker-indicator]:invert shadow-sm'
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className='p-6 border-t border-border-custom flex gap-3 bg-zinc-50/50 dark:bg-transparent'>
          <button
            onClick={onClose}
            className='flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-900 border border-border-custom rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:text-white transition-all'
          >
            CANCELAR
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className='flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2'
          >
            {isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              'SALVAR META'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
