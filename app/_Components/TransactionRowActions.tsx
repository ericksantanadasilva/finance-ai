'use client';

import { useRef, useState } from 'react';
import { MoreHorizontal, Trash2, Edit2, Loader2 } from 'lucide-react';
import { deleteTransaction } from '@/app/_actions/transactions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmDialog from '@/app/_Components/ConfirmDialog';
import { Button } from '@/components/ui/button';

interface RowActionsProps {
  transactionId: string;
  onEdit: () => void;
  isLast?: boolean;
}

const menuItemClass =
  'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium lowercase rounded-lg transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted outline-none';

export function TransactionRowActions({
  transactionId,
  onEdit,
  isLast = false,
}: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  // Botão "…": é para ele que o foco volta quando o diálogo de exclusão fecha
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteTransaction(transactionId);
      if (res.success) {
        toast.success('Transação excluída com sucesso!');
        router.refresh();
      } else {
        toast.error('Erro ao excluir');
      }
    } catch (error) {
      toast.error('Erro na requisição');
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    /* Aumentamos o z-index do container relativo quando aberto */
    <div
      className={`relative flex items-center justify-center ${isOpen ? 'z-50' : 'z-auto'}`}
    >
      <Button
        ref={triggerRef}
        variant='ghost'
        size='icon'
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDeleting}
        aria-label='Ações da transação'
        aria-expanded={isOpen}
        className='size-8 text-muted-foreground hover:text-foreground'
      >
        {isDeleting ? (
          <Loader2 className='w-4 h-4 animate-spin' />
        ) : (
          <MoreHorizontal className='w-4 h-4' />
        )}
      </Button>

      {isOpen && (
        <>
          {/* Overlay fixo para fechar e garantir que o clique fora funcione */}
          <div
            className='fixed inset-0 z-80 bg-transparent'
            onClick={() => setIsOpen(false)}
          />

          {/* Menu "adesivo" */}
          <div
            className={`
              absolute right-0 w-40 p-1
              bg-surface border-2 border-ink rounded-xl shadow-hard z-110
              animate-in fade-in zoom-in-95 duration-150
              ${isLast ? 'bottom-full mb-2' : 'top-full mt-2'}
            `}
          >
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className={`${menuItemClass} text-foreground`}
            >
              <Edit2 className='w-4 h-4 text-muted-foreground' />
              Editar
            </button>

            <div className='h-px bg-border-custom mx-2 my-1' />

            <button
              onClick={() => {
                // Fecha o menu: o foco volta para o "…" (returnFocusRef),
                // e não para este item, que deixa de existir
                setIsOpen(false);
                setIsConfirmOpen(true);
              }}
              className={`${menuItemClass} text-expense`}
            >
              <Trash2 className='w-4 h-4' />
              Excluir
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title='Excluir Transação'
        description='Tem certeza que deseja remover esta transação? Essa ação não poderá ser desfeita.'
        returnFocusRef={triggerRef}
      />
    </div>
  );
}
