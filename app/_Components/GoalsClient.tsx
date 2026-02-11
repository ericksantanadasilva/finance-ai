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
} from 'lucide-react';
import GoalDialog from '@/app/_Components/GoalDialog';
import UpdateGoalDialog from '@/app/_Components/UpdateGoalDialog';
import ConfirmDialog from '@/app/_Components/ConfirmDialog'; // Importe o ConfirmDialog
import { deleteGoal, updateGoalAmount } from '@/app/_actions/goals';
import { toast } from 'sonner';

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
  const [quickDepositGoal, setQuickDepositGoal] = useState<Goal | null>(null);

  // ESTADOS PARA EXCLUSÃO
  const [isDeleting, setIsDeleting] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const formatMoney = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v);

  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  // FUNÇÃO DE EXCLUSÃO REFORMULADA
  const handleConfirmDelete = async () => {
    if (!goalToDelete) return;

    setIsDeleting(true);
    try {
      await deleteGoal(goalToDelete);
      toast.success('Meta excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir meta.');
    } finally {
      setIsDeleting(false);
      setGoalToDelete(null);
    }
  };

  const handleConfirmQuickDeposit = async (amountToAdd: number) => {
    if (!quickDepositGoal) return;

    try {
      const newAmount = Number(quickDepositGoal.currentAmount) + amountToAdd;
      const res = await updateGoalAmount(quickDepositGoal.id, newAmount);

      if (res.success) {
        toast.success(
          `R$ ${amountToAdd.toLocaleString('pt-BR')} somados à meta ${quickDepositGoal.name}!`,
        );
      } else {
        toast.error('Erro ao atualizar o saldo da meta.');
      }
    } catch (error) {
      toast.error('Ocorreu um erro inesperado.');
    }
  };

  return (
    <div className='min-h-screen bg-background text-foreground p-4 sm:p-8 transition-all duration-300'>
      {/* 1. DIALOG DE CRIAÇÃO/EDIÇÃO COMPLETA */}
      <GoalDialog
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGoal(null);
        }}
        editData={selectedGoal}
      />

      {/* 2. DIALOG DE DEPÓSITO RÁPIDO */}
      <UpdateGoalDialog
        goal={quickDepositGoal}
        isOpen={!!quickDepositGoal}
        onClose={() => setQuickDepositGoal(null)}
      />

      {/* 3. DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <ConfirmDialog
        isOpen={!!goalToDelete}
        onClose={() => setGoalToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title='Excluir Meta'
        description='Tem certeza que deseja excluir esta meta? Todo o progresso acumulado será perdido permanentemente.'
      />

      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-12 lg:pt-0'>
        <div>
          <h1 className='text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight'>
            Metas Financeiras
          </h1>
          <p className='text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium'>
            Visualize e acompanhe seus sonhos de perto.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedGoal(null);
            setIsModalOpen(true);
          }}
          className='w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-2xl text-xs font-black tracking-[0.2em] transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95'
        >
          <Plus className='w-4 h-4' /> NOVA META
        </button>
      </div>

      {/* GRID DE CARDS */}
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
        {initialGoals.map((goal) => {
          const progress = calculateProgress(
            goal.currentAmount,
            goal.targetAmount,
          );

          return (
            <div
              key={goal.id}
              className='bg-surface border border-border-custom p-6 rounded-2xl group relative overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm dark:shadow-none animate-in fade-in slide-in-from-bottom-3 duration-500'
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
                  onClick={() => setGoalToDelete(goal.id)} // Abre o ConfirmDialog
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

              <h3 className='text-lg font-black text-foreground mb-4 pr-16 uppercase tracking-tight'>
                {goal.name}
              </h3>

              <div className='space-y-5'>
                <div className='flex justify-between items-end'>
                  <div className='flex flex-col'>
                    <span className='text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-widest mb-1'>
                      Acumulado
                    </span>
                    <span className='text-foreground font-black text-xl tracking-tight'>
                      {formatMoney(goal.currentAmount)}
                    </span>
                  </div>
                  <div className='flex flex-col items-end'>
                    <span className='text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-widest mb-1'>
                      Objetivo
                    </span>
                    <span className='text-zinc-500 dark:text-zinc-400 text-sm font-bold'>
                      {formatMoney(goal.targetAmount)}
                    </span>
                  </div>
                </div>

                <div className='space-y-3'>
                  {/* PROGRESS BAR REFINADA */}
                  <div className='h-3 w-full bg-zinc-100 dark:bg-zinc-900/50 rounded-full overflow-hidden shadow-inner border border-border-custom/50'>
                    <div
                      className='h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_#10b98140]'
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400'>
                      <Calendar className='w-3.5 h-3.5' />
                      <span className='text-[10px] font-black uppercase tracking-tighter'>
                        {goal.deadline}
                      </span>
                    </div>
                    <p className='text-xs font-black text-emerald-600 dark:text-emerald-500'>
                      {progress}%
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setQuickDepositGoal(goal)}
                  className='w-full mt-2 flex items-center justify-center gap-2 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-emerald-600 hover:text-white rounded-2xl text-[10px] font-black tracking-[0.2em] text-zinc-500 dark:text-zinc-400 transition-all border border-border-custom hover:border-emerald-600 active:scale-95 uppercase'
                >
                  <PlusCircle className='w-4 h-4' />
                  Adicionar Valor
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
