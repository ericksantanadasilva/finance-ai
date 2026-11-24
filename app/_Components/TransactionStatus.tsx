'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Repeat, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { setTransactionPaid } from '@/app/_actions/transactions';
import { APP_TIME_ZONE, currentMonthISO } from '@/app/utils/dates';

export default function TransactionStatus({
  id,
  isPaid,
  isRecurring,
  type,
  referenceDate,
}: {
  id: string;
  isPaid: boolean;
  isRecurring: boolean;
  type: string;
  referenceDate: string; // ISO; a competência é gravada no dia 1
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

  // Mesma regra da Visão Geral: pendente com competência anterior ao mês atual
  const isOverdue =
    !isPaid && referenceDate.slice(0, 7) < currentMonthISO(APP_TIME_ZONE);

  return (
    <span className='inline-flex items-center gap-1.5 flex-wrap'>
      {isRecurring && (
        <span
          title='Lançamento recorrente'
          className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium lowercase bg-surface-muted text-muted-foreground border border-border-custom'
        >
          <Repeat className='w-3 h-3' /> Recorrente
        </span>
      )}
      {isOverdue && (
        <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold lowercase bg-surface text-warning border-2 border-warning'>
          <Clock className='w-3 h-3' aria-hidden='true' />
          Atrasada
        </span>
      )}
      {!isPaid && (
        <button
          onClick={() => change(true)}
          disabled={pending}
          title={type === 'income' ? 'Marcar como recebido' : 'Marcar como pago'}
          className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold lowercase bg-surface text-warning border-2 border-warning hover:bg-warning/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'
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
