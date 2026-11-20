'use client';

import React, { useState } from 'react';
import {
  Plus,
  Target,
  Trash2,
  Edit2,
  PlusCircle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import GoalDialog from '@/app/_Components/GoalDialog';
import UpdateGoalDialog from '@/app/_Components/UpdateGoalDialog';
import ConfirmDialog from '@/app/_Components/ConfirmDialog'; // Importe o ConfirmDialog
import { deleteGoal } from '@/app/_actions/goals';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';

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

  // Math.floor: 99,9% mostra 99%, nunca arredonda para 100% antes da hora
  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.floor((current / target) * 100), 100);
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
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-10 lg:pt-0'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold lowercase'>
            Metas Financeiras
          </h1>
          <p className='text-muted-foreground text-xs sm:text-sm font-medium'>
            Visualize e acompanhe seus sonhos de perto.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedGoal(null);
            setIsModalOpen(true);
          }}
          className='w-full sm:w-auto'
        >
          <Plus className='w-4 h-4' /> NOVA META
        </Button>
      </div>

      {initialGoals.length === 0 ? (
        /* ESTADO VAZIO (mesmo padrão de Recorrentes) */
        <div className='border-2 border-dashed border-border-custom rounded-2xl p-12 text-center space-y-3'>
          <Target
            className='w-8 h-8 mx-auto text-muted-foreground'
            aria-hidden='true'
          />
          <p className='text-sm font-medium text-muted-foreground'>
            Nenhuma meta ainda. Crie a primeira e acompanhe quanto falta para
            chegar lá.
          </p>
        </div>
      ) : (
        /* GRID DE CARDS */
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
          {initialGoals.map((goal) => {
            const progress = calculateProgress(
              goal.currentAmount,
              goal.targetAmount,
            );
            // Concluída pelos valores, não pela porcentagem exibida
            const isDone = goal.currentAmount >= goal.targetAmount;

            return (
              <Card
                key={goal.id}
                className='group flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-500'
              >
                <CardHeader className='py-2'>
                  <h2 className='flex items-center gap-2 min-w-0 font-bold'>
                    <Target className='w-4 h-4 shrink-0' aria-hidden='true' />
                    {/* Nome como foi cadastrado (a faixa força minúsculas) */}
                    <span className='truncate normal-case' title={goal.name}>
                      {goal.name}
                    </span>
                  </h2>

                  {/* AÇÕES NO HOVER (ou quando recebem foco pelo teclado) */}
                  <div className='flex items-center shrink-0 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => {
                        setSelectedGoal(goal);
                        setIsModalOpen(true);
                      }}
                      aria-label={`Editar meta ${goal.name}`}
                      className='size-8 text-muted-foreground hover:text-foreground'
                    >
                      <Edit2 className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => setGoalToDelete(goal.id)} // Abre o ConfirmDialog
                      aria-label={`Excluir meta ${goal.name}`}
                      className='size-8 text-muted-foreground hover:text-expense'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className='flex-1 flex flex-col gap-5'>
                  <div className='flex justify-between items-end gap-3'>
                    <div className='flex flex-col min-w-0'>
                      <span className='text-xs text-muted-foreground font-medium lowercase mb-1'>
                        Acumulado
                      </span>
                      <span className='text-2xl font-bold tabular-nums tracking-tight wrap-break-word'>
                        {formatMoney(goal.currentAmount)}
                      </span>
                    </div>
                    <div className='flex flex-col items-end shrink-0'>
                      <span className='text-xs text-muted-foreground font-medium lowercase mb-1'>
                        Objetivo
                      </span>
                      <span className='text-sm font-bold text-muted-foreground tabular-nums'>
                        {formatMoney(goal.targetAmount)}
                      </span>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <ProgressBar
                      value={progress}
                      label={`Progresso da meta ${goal.name}`}
                    />

                    {/* min-h-6: a linha tem a mesma altura com o selo
                        "concluída" ou só com a porcentagem */}
                    <div className='flex justify-between items-center gap-3 min-h-6'>
                      <div className='flex items-center gap-1.5 text-muted-foreground'>
                        <Calendar className='w-3.5 h-3.5' aria-hidden='true' />
                        <span className='text-xs font-medium lowercase tabular-nums'>
                          {goal.deadline}
                        </span>
                      </div>
                      {isDone ? (
                        // Concluída: ícone + texto, além da cor
                        <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold lowercase bg-surface text-income border-2 border-income'>
                          <CheckCircle2 className='w-3 h-3' aria-hidden='true' />
                          Concluída
                        </span>
                      ) : (
                        <p className='text-xs font-bold tabular-nums'>
                          {progress}%
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant='outline'
                    onClick={() => setQuickDepositGoal(goal)}
                    className='w-full mt-auto'
                  >
                    <PlusCircle className='w-4 h-4' />
                    Adicionar Valor
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
