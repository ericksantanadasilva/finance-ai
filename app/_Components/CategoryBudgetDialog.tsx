'use client';

import { useId, useState } from 'react';
import { Gauge, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { setCategoryBudget } from '../_actions/categories';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { DialogCloseButton, DialogOverlay } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useModalBehavior } from '@/hooks/use-modal-behavior';

interface CategoryBudgetDialogProps {
  // null = fechado
  category: { id: string; name: string; budget: number | null } | null;
  onClose: () => void;
}

// Modal de limite mensal. Quem usa passa key={category?.id}: assim o campo
// começa com o limite atual a cada abertura, sem precisar de efeito.
export default function CategoryBudgetDialog({
  category,
  onClose,
}: CategoryBudgetDialogProps) {
  const [budgetValue, setBudgetValue] = useState(
    category?.budget ? String(category.budget) : '',
  );
  const [savingBudget, setSavingBudget] = useState(false);

  const titleId = useId();
  const panelRef = useModalBehavior<HTMLDivElement>({
    isOpen: !!category,
    onClose,
  });

  if (!category) return null;

  const handleSaveBudget = async () => {
    const value = budgetValue.trim() === '' ? null : Number(budgetValue);
    if (value !== null && (isNaN(value) || value < 0)) {
      return toast.error('Informe um valor válido.');
    }
    setSavingBudget(true);
    try {
      await setCategoryBudget(category.id, value);
      toast.success(
        value && value > 0
          ? `Limite de ${category.name} definido!`
          : `Limite de ${category.name} removido.`,
      );
      onClose();
    } catch {
      toast.error('Erro ao salvar limite.');
    } finally {
      setSavingBudget(false);
    }
  };

  return (
    <DialogOverlay className='animate-in fade-in duration-300'>
      <Card
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className='w-full max-w-md shadow-hard-lg relative animate-in zoom-in duration-200'
      >
        {/* HEADER */}
        <CardHeader className='px-6 py-4'>
          <h2
            id={titleId}
            className='text-base font-bold flex items-center gap-2 min-w-0'
          >
            <Gauge className='w-5 h-5 shrink-0' />
            <span className='truncate'>Limite: {category.name}</span>
          </h2>
          <DialogCloseButton onClick={onClose} />
        </CardHeader>

        <div className='p-6'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='category-budget-value'>
              Quanto posso gastar por mês?
            </Label>
            <Input
              id='category-budget-value'
              type='number'
              inputMode='decimal'
              min='0'
              step='0.01'
              autoFocus
              placeholder='Deixe vazio para remover o limite'
              value={budgetValue}
              onChange={(e) => setBudgetValue(e.target.value)}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className='p-6 border-t border-border-custom flex gap-3'>
          <Button variant='outline' onClick={onClose} className='flex-1 px-4'>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveBudget}
            disabled={savingBudget}
            className='flex-1 px-4'
          >
            {savingBudget ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              'SALVAR'
            )}
          </Button>
        </div>
      </Card>
    </DialogOverlay>
  );
}
