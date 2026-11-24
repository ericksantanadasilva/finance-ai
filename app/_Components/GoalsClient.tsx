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
  AlertTriangle,
  CalendarX,
} from 'lucide-react';
import { APP_TIME_ZONE } from '@/app/utils/dates';
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
  deadline: string; // já formatado para exibir ("dd/mm/aaaa" ou "Sem prazo")
  deadlineDate: string | null; // YYYY-MM-DD
  createdAt: string | null; // ISO; início do ritmo
}

// Regras do ritmo iguais às do app mobile (finance-mobile/src/lib/goals.ts):
// a situação vem do ritmo, não da porcentagem pura. Uma meta no começo com
// pouco juntado não é problema, se o prazo também mal começou.
type GoalPace =
  | { status: 'done' }
  /** Sem prazo, não há ritmo a cobrar. */
  | { status: 'noDeadline' }
  | { status: 'onTrack' }
  /** `expected`: porcentagem inteira do prazo já passada (1 a 100). */
  | { status: 'behind'; expected: number }
  | { status: 'overdue' }
  /** Sem data de criação válida: não dá para medir o ritmo (fica em income). */
  | { status: 'noPace' };

/** Tira o resíduo de ponto flutuante (ex.: 28.999999999999996 → 29). */
function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** Porcentagem juntada, exata (sem floor), para comparar com o ritmo. */
function savedPercent(goal: Goal) {
  if (goal.targetAmount <= 0) return 0;
  return round2((goal.currentAmount / goal.targetAmount) * 100);
}

/**
 * Progresso exibido: inteiro para baixo (99,9% mostra 99%, nunca 100% antes da
 * hora), limitado a 100.
 */
function goalProgress(goal: Goal) {
  return Math.min(Math.floor(savedPercent(goal)), 100);
}

/**
 * "YYYY-MM-DD" de hoje. Diferença do app (que usa o fuso do aparelho): o web
 * renderiza no servidor (UTC) e hidrata no navegador, então usa o fuso fixo
 * do app para os dois lados chegarem ao mesmo dia.
 */
function todayISO(now: Date) {
  // en-CA formata como YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Concluída pelos valores; vencida quando hoje já passou do dia do prazo; no
 * ritmo quando a porcentagem juntada alcança a porcentagem do tempo passado
 * entre a criação e o prazo.
 */
function goalPace(goal: Goal, now: Date): GoalPace {
  if (goal.currentAmount >= goal.targetAmount) return { status: 'done' };
  if (!goal.deadlineDate) return { status: 'noDeadline' };
  // O dia do prazo ainda conta: vence a partir do dia seguinte
  if (todayISO(now) > goal.deadlineDate) return { status: 'overdue' };

  const start = goal.createdAt ? new Date(goal.createdAt).getTime() : NaN;
  if (Number.isNaN(start)) return { status: 'noPace' };

  // Prazos são gravados ao meio-dia UTC do dia (parseDateOnly)
  const [year, month, day] = goal.deadlineDate.split('-').map(Number);
  const end = Date.UTC(year, month - 1, day, 12);
  const total = end - start;
  // Prazo anterior à criação: o tempo todo já passou
  const elapsed = total > 0 ? ((now.getTime() - start) / total) * 100 : 100;
  // Em pontos inteiros, os mesmos do texto: uma meta recém-criada (esperado
  // 0,07%) não aparece "abaixo do ritmo · esperado 0%"
  const expected = Math.floor(Math.min(Math.max(elapsed, 0), 100));

  return savedPercent(goal) >= expected
    ? { status: 'onTrack' }
    : { status: 'behind', expected };
}

// Cor da barra pelo ritmo. A cor só reforça: abaixo do ritmo e vencida têm
// texto e ícone
function barClassName(pace: GoalPace) {
  if (pace.status === 'overdue') return 'bg-expense';
  if (pace.status === 'behind') return 'bg-warning';
  return 'bg-income';
}

function paceLabel(pace: GoalPace) {
  if (pace.status === 'overdue') return ', prazo vencido';
  if (pace.status === 'behind') return ', abaixo do ritmo';
  return '';
}

export default function GoalsClient({
  initialGoals,
  now,
}: {
  initialGoals: Goal[];
  // Instante da renderização no servidor (ms): o navegador hidrata com o mesmo
  // valor, então a barra e o aviso do ritmo saem iguais nos dois lados
  now: number;
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
            const progress = goalProgress(goal);
            const pace = goalPace(goal, new Date(now));
            // Concluída pelos valores, não pela porcentagem exibida
            const isDone = pace.status === 'done';

            return (
              <Card
                key={goal.id}
                className='group flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-200'
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
                      label={`Progresso da meta ${goal.name}${paceLabel(pace)}`}
                      barClassName={barClassName(pace)}
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

                    {/* Ritmo: a cor da barra sempre vem com texto e ícone
                        (mesmos textos e ícones do app mobile) */}
                    {pace.status === 'behind' && (
                      <p className='flex items-center gap-1.5 text-xs font-bold lowercase tabular-nums text-warning'>
                        <AlertTriangle
                          className='w-3.5 h-3.5 shrink-0'
                          aria-hidden='true'
                        />
                        Abaixo do ritmo · esperado {pace.expected}% até hoje
                      </p>
                    )}
                    {pace.status === 'overdue' && (
                      <p className='flex items-center gap-1.5 text-xs font-bold lowercase text-expense'>
                        <CalendarX
                          className='w-3.5 h-3.5 shrink-0'
                          aria-hidden='true'
                        />
                        Prazo vencido
                      </p>
                    )}
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
