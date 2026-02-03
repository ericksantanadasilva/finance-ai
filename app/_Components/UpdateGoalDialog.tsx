// components/_Components/UpdateGoalDialog.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { X, DollarSign, Loader2, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface UpdateGoalDialogProps {
  goal: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<void>;
}

export default function UpdateGoalDialog({
  goal,
  isOpen,
  onClose,
  onConfirm,
}: UpdateGoalDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState('');

  // Limpa o input sempre que abrir para uma nova meta
  useEffect(() => {
    if (isOpen) setAmount('');
  }, [isOpen]);

  if (!isOpen || !goal) return null;

  const handleConfirm = () => {
    const numAmount = parseFloat(amount.replace(',', '.'));

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Insira um valor válido para depositar.');
      return;
    }

    startTransition(async () => {
      try {
        await onConfirm(numAmount);
        onClose();
      } catch (error) {
        toast.error('Erro ao atualizar a meta.');
      }
    });
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300'>
      <div className='w-full max-w-md bg-surface border border-border-custom rounded-2xl shadow-2xl relative animate-in zoom-in duration-200 flex flex-col'>
        {/* HEADER */}
        <div className='flex justify-between items-center p-6 border-b border-border-custom'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-500/10 rounded-lg'>
              <Target className='w-5 h-5 text-blue-500' />
            </div>
            <h2 className='text-lg font-black text-foreground uppercase tracking-tight'>
              Atualizar Meta
            </h2>
          </div>
          <button
            onClick={onClose}
            className='text-zinc-400 hover:text-foreground transition-colors p-1'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className='p-6 space-y-6'>
          <div className='space-y-1'>
            <p className='text-sm text-zinc-500 font-medium'>
              Quanto você deseja poupar para:
            </p>
            <p className='text-base font-bold text-foreground'>
              🎯 {goal.name}
            </p>
          </div>

          <div className='space-y-2'>
            <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
              Valor do Depósito
            </label>
            <div className='relative'>
              <div className='absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-bold z-10'>
                R$
              </div>
              <input
                type='number'
                step='0.01'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder='0,00'
                autoFocus
                className='w-full bg-background border border-border-custom rounded-xl pl-12 pr-4 py-4 text-2xl font-black text-foreground outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-400'
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className='flex gap-3 pt-2'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 py-4 px-4 bg-background border border-border-custom rounded-xl text-xs font-bold text-zinc-500 hover:text-foreground transition-all active:scale-95'
            >
              CANCELAR
            </button>
            <button
              type='button'
              onClick={handleConfirm}
              disabled={isPending || !amount}
              className='flex-1 py-4 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95'
            >
              {isPending ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <>
                  <TrendingUp className='w-4 h-4' />
                  CONFIRMAR
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
