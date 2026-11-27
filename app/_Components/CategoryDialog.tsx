'use client';

import { useId, useState } from 'react';
import { Loader2, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { createCategory } from '../_actions/categories';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { DialogCloseButton, DialogOverlay } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useModalBehavior } from '@/hooks/use-modal-behavior';
import CategoryColorField from './CategoryColorField';

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Modal de nova categoria. O estado fica aqui (o componente continua montado
// quando fechado), então a cor escolhida se mantém entre uma criação e outra.
export default function CategoryDialog({
  isOpen,
  onClose,
}: CategoryDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [newBudget, setNewBudget] = useState('');
  const [loading, setLoading] = useState(false);

  const titleId = useId();
  const panelRef = useModalBehavior<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name) return;
    setLoading(true);
    try {
      await createCategory(
        name,
        color,
        newBudget.trim() === '' ? null : Number(newBudget),
      );
      toast.success(`Categoria "${name}" criada!`);
      onClose();
      setName('');
      setNewBudget('');
    } catch (error) {
      toast.error('Erro ao criar categoria.');
    } finally {
      setLoading(false);
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
          <h2 id={titleId} className='text-base font-bold flex items-center gap-2'>
            <Tags className='w-5 h-5' />
            Nova Categoria
          </h2>
          <DialogCloseButton onClick={onClose} />
        </CardHeader>

        {/* FORMULÁRIO */}
        <div className='p-6 space-y-5'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='category-name'>Nome da Categoria</Label>
            <Input
              id='category-name'
              placeholder='Ex: alimentação, saúde...'
              autoComplete='off'
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <CategoryColorField
            id='category-color'
            value={color}
            onChange={setColor}
          />

          <div className='flex flex-col gap-2'>
            <Label htmlFor='category-budget'>Limite mensal (opcional)</Label>
            <Input
              id='category-budget'
              type='number'
              inputMode='decimal'
              min='0'
              step='0.01'
              placeholder='Ex: 800,00'
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className='p-6 border-t border-border-custom flex gap-3'>
          <Button variant='outline' onClick={onClose} className='flex-1 px-4'>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !name}
            className='flex-1 px-4'
          >
            {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : 'SALVAR'}
          </Button>
        </div>
      </Card>
    </DialogOverlay>
  );
}
