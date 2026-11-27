'use client';

import { useId, useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { updateCategory } from '../_actions/categories';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { DialogCloseButton, DialogOverlay } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useModalBehavior } from '@/hooks/use-modal-behavior';
import CategoryColorField from './CategoryColorField';

// O input de cor só aceita hex de 6 dígitos; categorias antigas podem ter outro formato
const FALLBACK_COLOR = '#71717a';
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

interface CategoryEditDialogProps {
  // null = fechado
  category: {
    id: string;
    name: string;
    color: string;
    budget: number | null;
  } | null;
  onClose: () => void;
}

// Modal de edição (limite mensal e cor). Quem usa passa key={category?.id}:
// assim os campos começam com os valores atuais a cada abertura, sem efeito.
export default function CategoryEditDialog({
  category,
  onClose,
}: CategoryEditDialogProps) {
  const [budgetValue, setBudgetValue] = useState(
    category?.budget ? String(category.budget) : '',
  );
  const [color, setColor] = useState(
    category && HEX_COLOR_RE.test(category.color)
      ? category.color.toLowerCase()
      : FALLBACK_COLOR,
  );
  const [saving, setSaving] = useState(false);

  const titleId = useId();
  const panelRef = useModalBehavior<HTMLDivElement>({
    isOpen: !!category,
    onClose,
  });

  if (!category) return null;

  const handleSave = async () => {
    const value = budgetValue.trim() === '' ? null : Number(budgetValue);
    if (value !== null && (isNaN(value) || value < 0)) {
      return toast.error('Informe um valor válido.');
    }
    setSaving(true);
    try {
      const updated = await updateCategory(category.id, {
        budget: value,
        // Só envia a cor se mudou: abrir e salvar não troca um formato antigo pelo padrão
        color: color !== category.color.toLowerCase() ? color : undefined,
      });
      if (updated) {
        toast.success(`Categoria "${category.name}" atualizada.`);
        onClose();
      } else {
        toast.error('Esta categoria não está mais disponível.');
      }
    } catch {
      toast.error('Erro ao salvar categoria.');
    } finally {
      setSaving(false);
    }
  };

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
            className='text-base font-bold flex items-center gap-2 min-w-0'
          >
            <Pencil className='w-5 h-5 shrink-0' />
            <span className='truncate'>Editar: {category.name}</span>
          </h2>
          <DialogCloseButton onClick={onClose} />
        </CardHeader>

        <div className='p-6 space-y-5'>
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

          <div className='space-y-2'>
            <CategoryColorField
              id='category-edit-color'
              value={color}
              onChange={setColor}
            />
            <p className='text-xs text-muted-foreground font-medium'>
              A cor nova vale também para as transações já registradas.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className='p-6 border-t border-border-custom flex gap-3'>
          <Button variant='outline' onClick={onClose} className='flex-1 px-4'>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className='flex-1 px-4'
          >
            {saving ? <Loader2 className='w-4 h-4 animate-spin' /> : 'SALVAR'}
          </Button>
        </div>
      </Card>
    </DialogOverlay>
  );
}
