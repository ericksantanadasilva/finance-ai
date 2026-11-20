'use client';

import React, { useState, useTransition, useEffect, useId } from 'react';
import { DollarSign, Loader2, Target, TrendingUp } from 'lucide-react';
import { updateGoalAmount } from '../_actions/goals';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { DialogCloseButton, DialogOverlay } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useModalBehavior } from '@/hooks/use-modal-behavior';

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

  const titleId = useId();
  const panelRef = useModalBehavior<HTMLDivElement>({
    isOpen: isOpen && !!goal,
    onClose,
  });

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
    <DialogOverlay className='animate-in fade-in duration-300'>
      <Card
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className='w-full max-w-md shadow-hard-lg relative animate-in zoom-in duration-200 flex flex-col'
      >
        {/* HEADER */}
        <CardHeader className='px-6 py-4'>
          <div className='flex items-center gap-3'>
            <Target className='w-5 h-5' />
            <h2 id={titleId} className='text-base font-bold'>
              Aporte Rápido
            </h2>
          </div>
          <DialogCloseButton onClick={onClose} />
        </CardHeader>

        {/* CONTEÚDO */}
        <div className='p-6 space-y-6'>
          <div className='bg-surface-muted p-4 rounded-xl border-2 border-ink'>
            <p className='text-xs text-muted-foreground font-bold lowercase mb-1'>
              Depositando em:
            </p>
            <p className='flex items-center gap-2 min-w-0 text-base font-bold text-foreground'>
              <Target className='w-4 h-4 shrink-0' aria-hidden='true' />
              <span className='truncate'>{goal.name}</span>
            </p>
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='update-goal-amount'>Quanto deseja adicionar?</Label>
            <div className='relative'>
              <div className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black z-10'>
                R$
              </div>
              <Input
                id='update-goal-amount'
                type='number'
                step='0.01'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder='0,00'
                autoFocus
                className='h-16 pl-12 text-2xl font-black'
              />
            </div>
            <p className='text-xs text-muted-foreground font-medium italic'>
              * Este valor será somado ao saldo atual da meta.
            </p>
          </div>

          {/* ACTIONS */}
          <div className='flex gap-3 pt-2'>
            <Button
              variant='outline'
              size='lg'
              onClick={onClose}
              className='flex-1 px-4'
            >
              CANCELAR
            </Button>
            <Button
              size='lg'
              onClick={handleConfirm}
              disabled={isPending || !amount}
              className='flex-1 px-4'
            >
              {isPending ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <>
                  <TrendingUp className='w-4 h-4' />
                  CONFIRMAR
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </DialogOverlay>
  );
}
