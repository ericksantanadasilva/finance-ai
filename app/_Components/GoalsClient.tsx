'use client';

import React, { useState } from 'react';
import {
  Plus,
  Target,
  Trash2,
  Edit2,
  PlusCircle,
  Loader2,
  Calendar,
  Menu,
} from 'lucide-react';
import GoalDialog from '@/app/_Components/GoalDialog';
import { deleteGoal, updateGoalAmount } from '@/app/_actions/goals';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export default function GoalsClient({
  initialGoals,
}: {
  initialGoals: Goal[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const formatMoney = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v);

  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
    await deleteGoal(id);
  };

  const handleQuickDeposit = async (goal: Goal) => {
    const amount = prompt(`Quanto deseja adicionar à meta "${goal.name}"?`);
    if (!amount || isNaN(parseFloat(amount))) return;

    setLoadingId(goal.id);
    try {
      const newAmount = Number(goal.currentAmount) + parseFloat(amount);
      await updateGoalAmount(goal.id, newAmount);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className='min-h-screen bg-background text-foreground p-4 sm:p-8 transition-all duration-300'>
      <GoalDialog
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGoal(null);
        }}
        editData={selectedGoal}
      />

      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-12 lg:pt-0'>
        <div className='flex items-center gap-4'>
          <div>
            <h1 className='text-xl sm:text-2xl font-bold text-foreground'>
              Metas Financeiras
            </h1>
            <p className='text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm'>
              Visualize e acompanhe seus sonhos.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedGoal(null);
            setIsModalOpen(true);
          }}
          className='w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2'
        >
          <Plus className='w-4 h-4' /> NOVA META
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
        {initialGoals.map((goal) => {
          const progress = calculateProgress(
            goal.currentAmount,
            goal.targetAmount,
          );

          return (
            <div
              key={goal.id}
              className='bg-surface border border-border-custom p-6 rounded-2xl group relative overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm dark:shadow-none'
            >
              {/* AÇÕES NO HOVER */}
              <div className='absolute top-4 right-4 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all z-10'>
                <button
                  onClick={() => {
                    setSelectedGoal(goal);
                    setIsModalOpen(true);
                  }}
                  className='p-2 bg-background border border-border-custom hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors'
                >
                  <Edit2 className='w-3.5 h-3.5' />
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className='p-2 bg-background border border-border-custom hover:bg-rose-500/10 rounded-lg text-zinc-500 hover:text-rose-500 transition-colors'
                >
                  <Trash2 className='w-3.5 h-3.5' />
                </button>
              </div>

              <div className='mb-4'>
                <div className='w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-center'>
                  <Target className='w-6 h-6 text-emerald-600 dark:text-emerald-500' />
                </div>
              </div>

              <h3 className='text-lg font-bold text-foreground mb-4 truncate pr-16'>
                {goal.name}
              </h3>

              <div className='space-y-5'>
                <div className='flex justify-between items-end'>
                  <div className='flex flex-col'>
                    <span className='text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-widest mb-1'>
                      Acumulado
                    </span>
                    <span className='text-foreground font-bold text-lg'>
                      {formatMoney(goal.currentAmount)}
                    </span>
                  </div>
                  <div className='flex flex-col items-end'>
                    <span className='text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-widest mb-1'>
                      Objetivo
                    </span>
                    <span className='text-zinc-500 dark:text-zinc-400 text-sm font-medium'>
                      {formatMoney(goal.targetAmount)}
                    </span>
                  </div>
                </div>

                <div className='space-y-3'>
                  {/* PROGRESS BAR */}
                  <div className='h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner'>
                    <div
                      className='h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_#10b98160]'
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400'>
                      <Calendar className='w-3.5 h-3.5' />
                      <span className='text-[10px] font-bold uppercase'>
                        {goal.deadline}
                      </span>
                    </div>
                    <p className='text-xs font-black text-emerald-600 dark:text-emerald-500'>
                      {progress}%
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleQuickDeposit(goal)}
                  disabled={loadingId === goal.id}
                  className='w-full mt-2 flex items-center justify-center gap-2 py-3 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-emerald-600 hover:text-white rounded-xl text-[10px] font-black tracking-widest text-zinc-500 dark:text-zinc-400 transition-all border border-border-custom hover:border-emerald-600'
                >
                  {loadingId === goal.id ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <PlusCircle className='w-4 h-4' />
                  )}
                  ADICIONAR VALOR
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
