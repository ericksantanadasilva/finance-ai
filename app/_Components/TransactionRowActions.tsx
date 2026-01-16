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
    const res = await deleteTransaction(transactionId);
    if (res.success) {
      router.refresh();
    } else {
      alert('Erro ao excluir');
    }
    setIsDeleting(false);
    setIsOpen(false);
  };

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='text-zinc-500 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-all'
      >
        {isDeleting ? (
          <Loader2 className='w-4 h-4 animate-spin' />
        ) : (
          <MoreHorizontal className='w-4 h-4' />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className='fixed inset-0 z-10'
            onClick={() => setIsOpen(false)}
          ></div>

          <div className='absolute right-0 mt-2 w-36 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in duration-200'>
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className='w-full flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors'
            >
              <Edit2 className='w-3.5 h-3.5' /> Editar
            </button>
            <button
              onClick={handleDelete}
              className='w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors'
            >
              <Trash2 className='w-3.5 h-3.5' /> Excluir
            </button>
          </div>
        </>
      )}
    </div>
  );
}
