'use client';

import { useState } from 'react';
import { MoreHorizontal, Trash2, Edit2, Loader2 } from 'lucide-react';
import { deleteTransaction } from '@/app/_actions/transactions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmDialog from '@/app/_Components/ConfirmDialog';

interface RowActionsProps {
  transactionId: string;
  onEdit: () => void;
  isLast?: boolean;
}

export function TransactionRowActions({
  transactionId,
  onEdit,
  isLast = false,
}: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDeleting}
        className='text-zinc-500 hover:text-foreground p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90 disabled:opacity-50'
      >
        {isDeleting ? (
          <Loader2 className='w-4 h-4 animate-spin text-primary' />
        ) : (
          <MoreHorizontal className='w-4 h-4' />
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay fixo para fechar e garantir que o clique fora funcione */}
          <div
            className='fixed inset-0 z-[80] bg-transparent'
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`
              absolute right-0 w-40 
              bg-surface border border-border-custom rounded-2xl shadow-2xl z-[110] 
              overflow-hidden animate-in fade-in zoom-in duration-200
              ${isLast ? 'bottom-full mb-2' : 'top-full mt-2'}
            `}
          >
            <div className='p-1.5 flex flex-col gap-1'>
              <button
                onClick={() => {
                  onEdit();
                  setIsOpen(false);
                }}
                className='w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-black uppercase tracking-tight text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group'
              >
                <Edit2 className='w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors' />
                Editar
              </button>

              <div className='h-px bg-border-custom mx-2' />

              <button
                onClick={() => setIsConfirmOpen(true)}
                className='w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-black uppercase tracking-tight text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors group'
              >
                <Trash2 className='w-3.5 h-3.5 text-rose-400 group-hover:text-rose-500 transition-colors' />
                Excluir
              </button>
            </div>
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
      />
    </div>
  );
}
