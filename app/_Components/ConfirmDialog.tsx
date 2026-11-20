'use client';

import React, { useId } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DialogOverlay } from '@/components/ui/dialog';
import { useModalBehavior } from '@/hooks/use-modal-behavior';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
  // Para onde o foco volta ao fechar. Use quando quem abriu o diálogo some
  // da tela (ex.: um item de menu); sem ele, volta ao elemento focado na abertura.
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
  variant = 'danger',
  returnFocusRef,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useModalBehavior<HTMLDivElement>({
    isOpen,
    onClose,
    returnFocusRef,
  });

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <DialogOverlay className='z-110 animate-in fade-in duration-150'>
      <Card
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className='w-full max-w-sm shadow-hard-lg relative animate-in fade-in zoom-in-95 duration-150'
      >
        {/* BOTÃO FECHAR */}
        <Button
          variant='ghost'
          size='icon'
          onClick={onClose}
          aria-label='Fechar'
          className='absolute top-3 right-3 size-8 text-muted-foreground hover:text-foreground'
        >
          <X className='w-4 h-4' />
        </Button>

        <div className='p-6 text-center space-y-4'>
          {/* ÍCONE DE ALERTA */}
          <div
            className={`mx-auto w-12 h-12 rounded-full border-2 border-ink flex items-center justify-center ${isDanger ? 'bg-expense/10 text-expense' : 'bg-warning/10 text-warning'}`}
          >
            <AlertTriangle className='w-6 h-6' />
          </div>

          <div className='space-y-2'>
            <h3 id={titleId} className='text-base font-bold text-foreground'>
              {title}
            </h3>
            <p
              id={descriptionId}
              className='text-sm text-muted-foreground font-medium leading-relaxed'
            >
              {description}
            </p>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className='flex gap-3 pt-2'>
            <Button
              variant='outline'
              onClick={onClose}
              disabled={isLoading}
              className='flex-1'
            >
              CANCELAR
            </Button>
            <Button
              variant={isDanger ? 'danger' : 'default'}
              onClick={onConfirm}
              disabled={isLoading}
              className='flex-1'
            >
              {isLoading ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                'CONFIRMAR'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </DialogOverlay>
  );
}
