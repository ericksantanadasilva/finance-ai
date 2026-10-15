'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Repeat, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { setTransactionPaid } from '@/app/_actions/transactions';

export default function TransactionStatus({
  id,
  isPaid,
  isRecurring,
  type,
}: {
  id: string;
  isPaid: boolean;
  isRecurring: boolean;
  type: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const change = (paid: boolean) => {
    startTransition(async () => {
      const res = await setTransactionPaid(id, paid);
      if (!res.success) {
        toast.error('Não foi possível atualizar o status.');
        return;
      }
      router.refresh();
      if (paid) {
        toast.success(type === 'income' ? 'Marcado como recebido.' : 'Marcado como pago.', {
          action: { label: 'Desfazer', onClick: () => change(false) },
        });
      }
    });
  };

  if (!isRecurring && isPaid) return null;

  return (
    <span className='inline-flex items-center gap-1.5 flex-wrap'>
      {isRecurring && (
        <span
          title='Lançamento recorrente'
          className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-purple-500/10 text-purple-500 border border-purple-500/20'
        >
          <Repeat className='w-3 h-3' /> Recorrente
        </span>
      )}
      {!isPaid && (
        <button
          onClick={() => change(true)}
          disabled={pending}
          title={type === 'income' ? 'Marcar como recebido' : 'Marcar como pago'}
          className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 transition-colors disabled:opacity-50'
        >
          {pending ? (
            <Loader2 className='w-3 h-3 animate-spin' />
          ) : (
            <Clock className='w-3 h-3' />
          )}
          {type === 'income' ? 'A receber' : 'A pagar'} · marcar
        </button>
      )}
    </span>
  );
}
