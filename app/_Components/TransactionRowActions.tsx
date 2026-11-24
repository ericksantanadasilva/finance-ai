'use client';

import { useRef, useState, useTransition } from 'react';
import { MoreHorizontal, Trash2, Edit2, Loader2, Clock } from 'lucide-react';
import {
  deleteTransaction,
  setTransactionPaid,
} from '@/app/_actions/transactions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmDialog from '@/app/_Components/ConfirmDialog';
import { Button } from '@/components/ui/button';

interface RowActionsProps {
  transactionId: string;
  isPaid: boolean;
  type: string;
  onEdit: () => void;
  isLast?: boolean;
}

const menuItemClass =
  'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium lowercase rounded-lg transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted outline-none';

export function TransactionRowActions({
  transactionId,
  isPaid,
  type,
  onEdit,
  isLast = false,
}: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isUpdatingPaid, startPaidTransition] = useTransition();
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

  // Mesmo fluxo do selo "a pagar · marcar" (TransactionStatus), no sentido inverso
  const changePaid = (paid: boolean) => {
    startPaidTransition(async () => {
      const res = await setTransactionPaid(transactionId, paid);
      if (!res.success) {
        toast.error('Não foi possível atualizar o status.');
        return;
      }
      router.refresh();
      if (!paid) {
        toast.success(
          type === 'income' ? 'Voltou para a receber.' : 'Voltou para a pagar.',
          { action: { label: 'Desfazer', onClick: () => changePaid(true) } },
        );
      }
    });
  };

  const isBusy = isDeleting || isUpdatingPaid;

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
        disabled={isBusy}
        aria-label='Ações da transação'
        aria-expanded={isOpen}
        className='size-8 text-muted-foreground hover:text-foreground'
      >
        {isBusy ? (
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
              absolute right-0 w-52 p-1
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

            {isPaid && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  changePaid(false);
                }}
                className={`${menuItemClass} text-foreground`}
              >
                <Clock className='w-4 h-4 text-muted-foreground' />
                Voltar para pendente
              </button>
            )}

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
