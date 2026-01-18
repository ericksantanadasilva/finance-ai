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
    <div className='min-h-screen bg-zinc-950 text-zinc-50 p-4 sm:p-8 transition-all duration-300'>
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
          {/* Botão de Sidebar Reintroduzido */}
          <button
            className='lg:hidden p-2 text-zinc-400 hover:text-white'
            onClick={() => window.dispatchEvent(new Event('open-sidebar'))}
          >
            <Menu className='w-6 h-6' />
          </button>
          <div>
            <h1 className='text-xl sm:text-2xl font-bold'>Metas Financeiras</h1>
            <p className='text-zinc-400 text-xs sm:text-sm'>
              Visualize e acompanhe seus sonhos.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedGoal(null);
            setIsModalOpen(true);
          }}
          className='w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg flex items-center justify-center gap-2'
        >
          <Plus className='w-4 h-4' /> Nova Meta
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
              className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl group relative overflow-hidden transition-all hover:border-zinc-700'
            >
              {/* BOTÕES DE AÇÃO REPOSICIONADOS */}
              <div className='absolute top-4 right-4 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10'>
                <button
                  onClick={() => {
                    setSelectedGoal(goal);
                    setIsModalOpen(true);
                  }}
                  className='p-2 bg-zinc-950/50 hover:bg-zinc-800 rounded-lg text-zinc-400 border border-zinc-800'
                >
                  <Edit2 className='w-4 h-4' />
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className='p-2 bg-zinc-950/50 hover:bg-rose-500/10 rounded-lg text-zinc-400 hover:text-rose-500 border border-zinc-800'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>

              <div className='mb-4'>
                <div className='w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center'>
                  <Target className='w-6 h-6 text-emerald-500' />
                </div>
              </div>

              <h3 className='text-lg font-bold text-white mb-4 truncate pr-10'>
                {goal.name}
              </h3>

              <div className='space-y-4'>
                <div className='flex justify-between items-end'>
                  <div className='flex flex-col'>
                    <span className='text-[10px] text-zinc-500 uppercase font-bold mb-1'>
                      Atual
                    </span>
                    <span className='text-white font-bold'>
                      {formatMoney(goal.currentAmount)}
                    </span>
                  </div>
                  <div className='flex flex-col items-end'>
                    <span className='text-[10px] text-zinc-500 uppercase font-bold mb-1'>
                      Objetivo
                    </span>
                    <span className='text-zinc-400 text-sm'>
                      {formatMoney(goal.targetAmount)}
                    </span>
                  </div>
                </div>

                <div className='space-y-2'>
                  <div className='h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden p-[2px]'>
                    <div
                      className='h-full bg-emerald-500 rounded-full transition-all duration-1000'
                      style={{
                        width: `${progress}%`,
                        boxShadow: '0 0 10px #10b98140',
                      }}
                    />
                  </div>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-1.5 text-zinc-500'>
                      <Calendar className='w-3 h-3' />
                      <span className='text-[10px] font-medium uppercase'>
                        {goal.deadline}
                      </span>
                    </div>
                    <p className='text-xs font-bold text-emerald-500'>
                      {progress}%
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleQuickDeposit(goal)}
                  disabled={loadingId === goal.id}
                  className='w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-zinc-800/50 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold text-zinc-400 transition-all border border-zinc-800'
                >
                  {loadingId === goal.id ? (
                    <Loader2 className='w-3 h-3 animate-spin' />
                  ) : (
                    <PlusCircle className='w-4 h-4' />
                  )}
                  ADICIONAR VALOR
                </button>
              </div>
            </div>
          );
        })}
        {/* Card de Novo Sonho omitido para brevidade */}
      </div>
    </div>
  );
}
