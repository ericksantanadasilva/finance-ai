'use client';

import React, { useState, useTransition, useEffect, useId } from 'react';
import { Target, DollarSign, Loader2 } from 'lucide-react';
import { createGoal, updateGoal } from '../_actions/goals'; // Importada a função updateGoal
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { DialogCloseButton, DialogOverlay } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useModalBehavior } from '@/hooks/use-modal-behavior';

interface GoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: any;
}

export default function GoalDialog({
  isOpen,
  onClose,
  editData,
}: GoalDialogProps) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setName(editData.name);
        setTargetAmount(editData.targetAmount.toString());
        setCurrentAmount(editData.currentAmount.toString());

        // deadlineDate já vem em "YYYY-MM-DD", o formato do DatePicker. O
        // deadline é o texto de exibição ("dd/mm/aaaa"), que o new Date lia
        // como mês/dia: o campo abria vazio ou com a data errada, e salvar a
        // edição apagava ou trocava o prazo
        setDeadline(editData.deadlineDate ?? '');
      } else {
        setName('');
        setTargetAmount('');
        setCurrentAmount('0');
        setDeadline('');
      }
    }
  }, [editData, isOpen]);

  const titleId = useId();
  const panelRef = useModalBehavior<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!name || !targetAmount) {
      toast.warning('Nome e Valor Alvo são obrigatórios!');
      return;
    }

    startTransition(async () => {
      const payload = {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || '0'),
        deadline: deadline || undefined,
      };

      let result;
      if (editData) {
        // Agora chamamos updateGoal para editar todos os campos, não apenas o valor
        result = await updateGoal(editData.id, payload);
      } else {
        result = await createGoal(payload);
      }

      if (result.success) {
        toast.success(
          editData
            ? 'Meta atualizada com sucesso!'
            : 'Meta criada com sucesso!',
        );
        onClose();
      } else {
        toast.error('Erro ao salvar meta!');
      }
    });
  }

  return (
    <DialogOverlay className='animate-in fade-in duration-150'>
      <Card
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className='w-full max-w-md shadow-hard-lg relative animate-in fade-in zoom-in-95 duration-150'
      >
        {/* HEADER */}
        <CardHeader className='px-6 py-4'>
          <h2
            id={titleId}
            className='text-base font-bold flex items-center gap-2'
          >
            <Target className='w-5 h-5' />
            {editData ? 'Editar Meta' : 'Nova Meta'}
          </h2>
          <DialogCloseButton onClick={onClose} />
        </CardHeader>

        {/* FORMULÁRIO */}
        <div className='p-6 space-y-5'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='goal-name'>Nome do Objetivo</Label>
            <Input
              id='goal-name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex: Viagem, Carro Novo...'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='goal-target'>Valor Alvo</Label>
              <div className='relative'>
                <DollarSign className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                <Input
                  id='goal-target'
                  type='number'
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder='0,00'
                  className='pl-10'
                />
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              <Label htmlFor='goal-current' className='text-income'>
                {/* normal-case: o Label força minúsculas, mas "R$" não muda */}
                Guardado (<span className='normal-case'>R$</span>)
              </Label>
              <div className='relative'>
                <DollarSign className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-income' />
                <Input
                  id='goal-current'
                  type='number'
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='goal-deadline'>Prazo Final (Opcional)</Label>
            {/* Opcional: "limpar data" volta para sem prazo */}
            <DatePicker
              id='goal-deadline'
              value={deadline}
              onChange={setDeadline}
              placeholder='Sem prazo'
              clearable
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className='p-6 border-t border-border-custom flex gap-3'>
          <Button variant='outline' onClick={onClose} className='flex-1 px-4'>
            CANCELAR
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className='flex-1 px-4'
          >
            {isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              'SALVAR META'
            )}
          </Button>
        </div>
      </Card>
    </DialogOverlay>
  );
}
