'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Repeat,
  Pause,
  Pencil,
  Play,
  Trash2,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  toggleRecurringRule,
  deleteRecurringRule,
} from '@/app/_actions/recurring';
import type { RecurringRuleItem } from '@/lib/finance/recurring';
import ConfirmDialog from '@/app/_Components/ConfirmDialog';
import RecurringDialog from './RecurringDialog';
import CategoryBadge from './CategoryBadge';
import TypeIcon from './TypeIcon';
import { StatCard } from './StatCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const formatMoney = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v,
  );

// Selos no padrão do TransactionStatus: neutro para informação,
// contorno colorido + ícone para estado
const badgeBase =
  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium lowercase';

export default function RecurringClient({
  initialRules,
  categoryNames,
}: {
  initialRules: RecurringRuleItem[];
  categoryNames: string[];
}) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<RecurringRuleItem | null>(null);

  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const active = initialRules.filter((r) => r.active);
  const monthlyExpense = active
    .filter((r) => r.type === 'expense')
    .reduce((acc, r) => acc + r.amount, 0);
  const monthlyIncome = active
    .filter((r) => r.type === 'income')
    .reduce((acc, r) => acc + r.amount, 0);

  const handleToggle = async (rule: RecurringRuleItem) => {
    setBusyId(rule.id);
    try {
      await toggleRecurringRule(rule.id, !rule.active);
      toast.success(rule.active ? 'Recorrência pausada.' : 'Recorrência retomada.');
      router.refresh();
    } catch {
      toast.error('Erro ao atualizar.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRecurringRule(ruleToDelete);
      toast.success('Recorrência excluída. O histórico foi mantido.');
      router.refresh();
    } catch {
      toast.error('Erro ao excluir.');
    } finally {
      setIsDeleting(false);
      setRuleToDelete(null);
    }
  };

  return (
    <div className='min-h-screen bg-background text-foreground p-4 sm:p-8 transition-colors duration-300'>
      <ConfirmDialog
        isOpen={!!ruleToDelete}
        onClose={() => setRuleToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title='Excluir Recorrência'
        description='Novos lançamentos deixarão de ser gerados. As transações já criadas continuam no seu histórico.'
      />

      <RecurringDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        categoryNames={categoryNames}
      />

      {/* Instância separada para editar: o rascunho da nova recorrência
          continua guardado; key faz os campos começarem com os da regra */}
      {ruleToEdit && (
        <RecurringDialog
          key={ruleToEdit.id}
          isOpen
          onClose={() => setRuleToEdit(null)}
          categoryNames={categoryNames}
          editData={ruleToEdit}
        />
      )}

      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-10 lg:pt-0'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold lowercase'>
            Recorrentes
          </h1>
          <p className='text-muted-foreground text-xs sm:text-sm font-medium'>
            Contas fixas e receitas mensais lançadas automaticamente.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)} className='w-full sm:w-auto'>
          <Plus className='w-4 h-4' /> Nova recorrência
        </Button>
      </div>

      {/* RESUMO */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6'>
        <StatCard
          label='Despesas fixas / mês'
          icon={ArrowDownCircle}
          value={formatMoney(monthlyExpense)}
          tone='expense'
        />
        <StatCard
          label='Receitas fixas / mês'
          icon={ArrowUpCircle}
          value={formatMoney(monthlyIncome)}
          tone='income'
        />
      </div>

      {/* LISTA */}
      {initialRules.length === 0 ? (
        <div className='border-2 border-dashed border-border-custom rounded-2xl p-12 text-center space-y-3'>
          <Repeat
            className='w-8 h-8 mx-auto text-muted-foreground'
            aria-hidden='true'
          />
          <p className='text-sm font-medium text-muted-foreground'>
            Nenhuma recorrência ainda. Cadastre aluguel, assinaturas ou salário
            e eles entram sozinhos todo mês.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {initialRules.map((rule) => (
            // Ativa = adesivo; pausada = plana, com borda fina (sem baixar a
            // opacidade, que derrubaria o contraste do texto)
            <Card
              key={rule.id}
              className={cn(
                'p-5',
                !rule.active && 'border-border-custom shadow-none',
              )}
            >
              <div className='flex justify-between items-start gap-3'>
                <div className='flex items-center gap-3 min-w-0'>
                  <TypeIcon type={rule.type} />
                  <div className='min-w-0 space-y-1'>
                    <p className='font-bold text-sm truncate'>
                      {rule.description}
                    </p>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-xs font-medium text-muted-foreground tabular-nums'>
                        Todo dia {rule.dayOfMonth}
                      </span>
                      <CategoryBadge
                        name={rule.category?.name ?? 'Sem categoria'}
                        color={rule.category?.color}
                      />
                    </div>
                  </div>
                </div>
                <p
                  className={`font-bold text-sm tabular-nums whitespace-nowrap shrink-0 ${rule.type === 'income' ? 'text-income' : 'text-expense'}`}
                >
                  {rule.type === 'expense' ? '- ' : ''}
                  {formatMoney(rule.amount)}
                </p>
              </div>

              <div className='mt-4 flex items-center justify-between gap-3'>
                <div className='flex flex-wrap items-center gap-1.5'>
                  {rule.active ? (
                    <span
                      className={cn(
                        badgeBase,
                        'font-bold bg-surface text-income border-2 border-income',
                      )}
                    >
                      <CheckCircle2 className='w-3 h-3' aria-hidden='true' />
                      Ativa
                    </span>
                  ) : (
                    <span
                      className={cn(
                        badgeBase,
                        'bg-surface-muted text-muted-foreground border border-border-custom',
                      )}
                    >
                      <Pause className='w-3 h-3' aria-hidden='true' />
                      Pausada
                    </span>
                  )}
                  {rule.lastGeneratedMonth && (
                    <span className='text-xs font-medium text-muted-foreground tabular-nums'>
                      último lançamento{' '}
                      {rule.lastGeneratedMonth.split('-').reverse().join('/')}
                    </span>
                  )}
                </div>
                <div className='flex items-center gap-1 shrink-0'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setRuleToEdit(rule)}
                    aria-label={`Editar ${rule.description}`}
                    className='size-8 text-muted-foreground hover:text-foreground'
                  >
                    <Pencil className='w-4 h-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleToggle(rule)}
                    disabled={busyId === rule.id}
                    aria-label={rule.active ? 'Pausar' : 'Retomar'}
                    className='size-8 text-muted-foreground hover:text-foreground'
                  >
                    {busyId === rule.id ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : rule.active ? (
                      <Pause className='w-4 h-4' />
                    ) : (
                      <Play className='w-4 h-4' />
                    )}
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setRuleToDelete(rule.id)}
                    aria-label='Excluir recorrência'
                    className='size-8 text-muted-foreground hover:text-expense'
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
