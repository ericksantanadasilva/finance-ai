'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { X, Target, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { createGoal, updateGoalAmount } from '../_actions/goals';

interface GoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: any; // Dados da meta para edição
}

export default function GoalDialog({
  isOpen,
  onClose,
  editData,
}: GoalDialogProps) {
  const [isPending, startTransition] = useTransition();

  // Estados do Formulário
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');

  // Efeito para preencher os campos quando entrar em modo de edição
  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setTargetAmount(editData.targetAmount.toString());
      setCurrentAmount(editData.currentAmount.toString());
      // Formata a data para o padrão yyyy-mm-dd do input date
      if (editData.deadline && editData.deadline !== 'Sem prazo') {
        const parts = editData.deadline.split('/');
        if (parts.length === 3) {
          setDeadline(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
    } else {
      // Limpa os campos ao abrir para criação
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setDeadline('');
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!name || !targetAmount) {
      alert('Nome e Valor Alvo são obrigatórios!');
      return;
    }

    startTransition(async () => {
      let result;

      if (editData) {
        // Lógica de Edição (Podemos expandir a action updateGoalAmount ou criar uma updateGoal completa)
        // Por enquanto, usaremos a lógica de atualização do valor atual
        result = await updateGoalAmount(editData.id, parseFloat(currentAmount));
        // Se precisar editar nome/target, você precisará da action updateGoal no goals.ts
      } else {
        // Lógica de Criação
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
        alert('Erro ao salvar meta!');
      }
    });
  }

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
      <div className='w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200'>
        {/* HEADER */}
        <div className='flex justify-between items-center p-6 border-b border-zinc-800'>
          <h2 className='text-lg font-bold text-white flex items-center gap-2'>
            <Target className='w-5 h-5 text-emerald-500' />
            {editData ? 'Editar Meta' : 'Nova Meta'}
          </h2>
          <button
            onClick={onClose}
            className='text-zinc-500 hover:text-white transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* FORMULÁRIO */}
        <div className='p-6 space-y-5'>
          <div className='space-y-2'>
            <label className='text-xs font-medium text-zinc-400 uppercase tracking-wider'>
              Nome do Objetivo
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex: Viagem, Carro Novo...'
              className='w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-all disabled:opacity-50'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-xs font-medium text-zinc-400 uppercase tracking-wider'>
                Valor Alvo
              </label>
              <div className='relative'>
                <DollarSign className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500' />
                <input
                  type='number'
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder='0,00'
                  className='w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-all disabled:opacity-50'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-xs font-medium text-zinc-400 uppercase tracking-wider text-emerald-500'>
                Progresso (R$)
              </label>
              <div className='relative'>
                <DollarSign className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50' />
                <input
                  type='number'
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className='w-full bg-zinc-900 border border-emerald-500/20 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-all'
                />
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-medium text-zinc-400 uppercase tracking-wider'>
              Prazo Final (Opcional)
            </label>
            <div className='relative'>
              <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500' />
              <input
                type='date'
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className='w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-300 focus:border-emerald-500 outline-none transition-all [&::-webkit-calendar-picker-indicator]:invert disabled:opacity-50'
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className='p-6 border-t border-zinc-800 flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-400 hover:text-white transition-all'
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className='flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2'
          >
            {isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              'Salvar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
