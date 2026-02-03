'use client';

import { useState } from 'react';
import { MoreHorizontal, Trash2, Edit2, Loader2 } from 'lucide-react';
import { deleteTransaction } from '@/app/_actions/transactions';
import { useRouter } from 'next/navigation';

interface RowActionsProps {
  transactionId: string;
  onEdit: () => void;
}

export function TransactionRowActions({
  transactionId,
  onEdit,
}: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    setIsDeleting(true);
    try {
      const res = await deleteTransaction(transactionId);
      if (res.success) {
        router.refresh();
      } else {
        alert('Erro ao excluir');
      }
    } catch (error) {
      alert('Erro na requisição');
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className='relative'>
      {/* BOTÃO DISPARADOR */}
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
          {/* OVERLAY PARA FECHAR AO CLICAR FORA */}
          <div
            className='fixed inset-0 z-[80]'
            onClick={() => setIsOpen(false)}
          />

          {/* MENU DROPDOWN */}
          <div
            className={`
            absolute right-0 bottom-full mb-2 md:top-full md:bottom-auto md:mt-2 w-40 
            bg-surface border border-border-custom rounded-2xl shadow-xl z-[90] 
            overflow-hidden animate-in fade-in zoom-in duration-200
          `}
          >
            <div className='p-1.5 flex flex-col gap-1'>
              <button
                onClick={() => {
                  onEdit();
                  setIsOpen(false);
                }}
                className='w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group'
              >
                <Edit2 className='w-3.5 h-3.5 text-zinc-400 group-hover:text-primary transition-colors' />
                Editar
              </button>

              <div className='h-px bg-border-custom mx-2' />

              <button
                onClick={handleDelete}
                className='w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors group'
              >
                <Trash2 className='w-3.5 h-3.5 text-rose-400 group-hover:text-rose-500 transition-colors' />
                Excluir
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
