'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { X, DollarSign, Loader2, Target, TrendingUp } from 'lucide-react';
import { updateGoalAmount } from '../_actions/goals';
import { toast } from 'sonner';

interface UpdateGoalDialogProps {
  goal: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdateGoalDialog({
  goal,
  isOpen,
  onClose,
}: UpdateGoalDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState('');

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
        // Chamamos a action diretamente aqui.
        // Como o goals.ts usa 'increment', passamos APENAS o numAmount (ex: 1)
        const res = await updateGoalAmount(goal.id, numAmount);

        if (res.success) {
          toast.success(
            `R$ ${numAmount.toLocaleString('pt-BR')} adicionados à meta!`,
          );
          onClose();
        } else {
          toast.error('Erro ao atualizar a meta.');
        }
      } catch (error) {
        toast.error('Erro na requisição.');
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
              Aporte Rápido
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
          <div className='bg-blue-500/5 p-4 rounded-xl border border-blue-500/10'>
            <p className='text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1'>
              Depositando em:
            </p>
            <p className='text-base font-bold text-foreground truncate'>
              🎯 {goal.name}
            </p>
          </div>

          <div className='space-y-2'>
            <label className='text-[10px] font-black text-zinc-500 uppercase tracking-widest'>
              Quanto deseja adicionar?
            </label>
            <div className='relative'>
              <div className='absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-black z-10'>
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
            <p className='text-[9px] text-zinc-500 font-medium italic'>
              * Este valor será somado ao saldo atual da meta.
            </p>
          </div>

          {/* ACTIONS */}
          <div className='flex gap-3 pt-2'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 py-4 px-4 bg-background border border-border-custom rounded-xl text-xs font-black text-zinc-500 hover:text-foreground transition-all uppercase tracking-widest'
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
