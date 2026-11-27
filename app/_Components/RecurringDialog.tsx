'use client';

import { useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Clock,
  FileText,
  Loader2,
  Repeat,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createRecurringRule,
  updateRecurringRule,
} from '@/app/_actions/recurring';
import type { RecurringRuleItem } from '@/lib/finance/recurring';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { DialogCloseButton, DialogOverlay } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useModalBehavior } from '@/hooks/use-modal-behavior';

const toMonth = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const currentMonth = () => toMonth(new Date());

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  return toMonth(new Date(y, m - 1 + delta, 1));
}

/** "2026-12" → "Dezembro de 2026" */
function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Mês a partir do qual a edição vale (a mesma regra do updateRecurringRule):
 * o mês atual e os atrasados são lançados antes com os dados antigos. Uma regra
 * que ainda não lançou nada vale desde o início escolhido. Pausada: null.
 */
function editEffectiveMonth(rule: RecurringRuleItem, newStart: string) {
  if (!rule.active) return null;
  const now = currentMonth();
  const launchesNow = rule.lastGeneratedMonth !== null || rule.startMonth <= now;
  if (!launchesNow) return newStart;
  const next = shiftMonth(now, 1);
  return newStart > next ? newStart : next;
}

interface RecurringDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryNames: string[]; // de getCategoryOptions: já inclui as padrão
  // Com editData, edita a regra. Quem usa passa key={editData.id}, para os
  // campos começarem com os valores da regra a cada abertura
  editData?: RecurringRuleItem | null;
}

// Modal de nova recorrência ou de edição (mesmo layout do TransactionDialog).
// Na criação, o estado fica aqui; como o componente continua montado quando
// fechado, o que foi digitado se mantém ao cancelar e só é limpo depois de salvar.
export default function RecurringDialog({
  isOpen,
  onClose,
  categoryNames,
  editData,
}: RecurringDialogProps) {
  const router = useRouter();
  const isEdit = !!editData;

  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState(editData?.description ?? '');
  const [amount, setAmount] = useState(
    editData ? String(editData.amount) : '',
  );
  const [type, setType] = useState<'expense' | 'income'>(
    editData?.type === 'income' ? 'income' : 'expense',
  );
  const [category, setCategory] = useState(editData?.category?.name ?? '');
  const [dayOfMonth, setDayOfMonth] = useState(
    editData ? String(editData.dayOfMonth) : '5',
  );
  const [startMonth, setStartMonth] = useState(
    editData?.startMonth ?? currentMonth(),
  );

  const titleId = useId();
  const panelRef = useModalBehavior<HTMLDivElement>({ isOpen, onClose });

  // Opções de mês de início (12 meses atrás até 6 à frente). Na edição de uma
  // regra que já lançou, só o início atual ou meses depois do último lançado
  const startMonthOptions = useMemo(() => {
    const values: string[] = [];
    const now = new Date();
    for (let i = -12; i <= 6; i++) {
      values.push(toMonth(new Date(now.getFullYear(), now.getMonth() + i, 1)));
    }
    if (editData && !values.includes(editData.startMonth)) {
      values.push(editData.startMonth);
    }
    const last = editData?.lastGeneratedMonth;
    return values
      .filter((v) => !last || v === editData.startMonth || v > last)
      .sort()
      .map((value) => ({ value, label: monthLabel(value) }));
  }, [editData]);

  // Categoria atual que não está nas opções é uma arquivada: continua
  // selecionável para ser mantida (decisão 13)
  const archivedCurrent =
    editData?.category && !categoryNames.includes(editData.category.name)
      ? editData.category.name
      : null;

  if (!isOpen) return null;

  const effectiveMonth = editData
    ? editEffectiveMonth(editData, startMonth)
    : null;

  const reset = () => {
    setDescription('');
    setAmount('');
    setType('expense');
    setCategory('');
    setDayOfMonth('5');
    setStartMonth(currentMonth());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const input = {
        description,
        amount: Number(amount),
        type,
        category,
        dayOfMonth: Number(dayOfMonth),
        startMonth,
      };
      const res = editData
        ? await updateRecurringRule(editData.id, input)
        : await createRecurringRule(input);
      if (res.success) {
        toast.success(isEdit ? 'Recorrência atualizada!' : 'Recorrência criada!');
        onClose();
        if (!isEdit) reset();
        router.refresh();
      } else {
        toast.error(res.error ?? 'Erro ao salvar.');
      }
    } catch {
      toast.error('Erro ao salvar.');
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
        className='w-full max-w-md shadow-hard-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150'
      >
        {/* HEADER */}
        <CardHeader className='px-6 py-4'>
          <h2
            id={titleId}
            className='text-base font-bold flex items-center gap-2'
          >
            <Repeat className='w-5 h-5' />
            {isEdit ? 'Editar Recorrência' : 'Nova Recorrência'}
          </h2>
          <DialogCloseButton onClick={onClose} />
        </CardHeader>

        <div className='p-6 overflow-y-auto custom-scrollbar space-y-6'>
          {/* EDIÇÃO: quando a mudança passa a valer (informativo, plano) */}
          {isEdit && (
            <p className='flex items-start gap-2 p-3 rounded-xl border-2 border-border-custom bg-surface text-xs font-medium text-muted-foreground'>
              <Clock className='w-4 h-4 shrink-0' aria-hidden='true' />
              <span>
                {effectiveMonth ? (
                  <>
                    A mudança vale a partir de{' '}
                    <strong className='text-foreground'>
                      {monthLabel(effectiveMonth)}
                    </strong>
                    . O que já foi lançado fica como está.
                  </>
                ) : (
                  'Recorrência pausada: a mudança vale a partir do mês em que você retomar. O que já foi lançado fica como está.'
                )}
              </span>
            </p>
          )}

          {/* TIPO: o selecionado vira "adesivo" na cor do tipo; a seta reforça entrada/saída */}
          <div className='grid grid-cols-2 gap-3'>
            <Button
              variant={type === 'income' ? 'income' : 'outline'}
              aria-pressed={type === 'income'}
              onClick={() => setType('income')}
            >
              <ArrowUpCircle className='w-4 h-4' /> RECEITA
            </Button>
            <Button
              variant={type === 'expense' ? 'expense' : 'outline'}
              aria-pressed={type === 'expense'}
              onClick={() => setType('expense')}
            >
              <ArrowDownCircle className='w-4 h-4' /> DESPESA
            </Button>
          </div>

          {/* VALOR */}
          <div className='flex flex-col gap-2'>
            <Label htmlFor='recurring-amount'>Valor</Label>
            <div className='relative'>
              <span className='absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground'>
                R$
              </span>
              <Input
                id='recurring-amount'
                type='number'
                step='0.01'
                min='0'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`h-16 pl-12 text-2xl font-black ${type === 'income' ? 'text-income' : 'text-expense'}`}
              />
            </div>
          </div>

          {/* INÍCIO (mesmo estilo do Mês de Competência) */}
          <div className='p-4 bg-surface-muted border-2 border-ink rounded-xl space-y-3'>
            <div className='flex items-center gap-2'>
              <Clock className='w-4 h-4' />
              <Label htmlFor='recurring-start'>Começa em</Label>
            </div>
            <Select value={startMonth} onValueChange={setStartMonth}>
              <SelectTrigger id='recurring-start'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {startMonthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground font-medium'>
              {editData?.lastGeneratedMonth
                ? `* Só dá para mudar para um mês depois do último lançado (${monthLabel(editData.lastGeneratedMonth)}). Os meses do meio não são lançados.`
                : '* Meses anteriores ao atual entram como pagos; o mês atual fica pendente até você marcar como pago.'}
            </p>
          </div>

          <div className='space-y-4'>
            {/* DESCRIÇÃO */}
            <div className='flex flex-col gap-2'>
              <Label htmlFor='recurring-description'>Descrição</Label>
              <div className='relative'>
                <FileText className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                <Input
                  id='recurring-description'
                  type='text'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Ex: Aluguel, Netflix, Salário...'
                  className='pl-12'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              {/* CATEGORIA */}
              <div className='flex flex-col gap-2'>
                <Label htmlFor='recurring-category'>Categoria</Label>
                <div className='relative'>
                  <Tag className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger
                      id='recurring-category'
                      className='pl-12 pr-4 text-xs'
                    >
                      <SelectValue placeholder='Selecionar...' />
                    </SelectTrigger>
                    <SelectContent>
                      {archivedCurrent && (
                        <SelectItem value={archivedCurrent}>
                          {archivedCurrent} (arquivada)
                        </SelectItem>
                      )}
                      {categoryNames.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* DIA DO MÊS */}
              <div className='flex flex-col gap-2'>
                <Label htmlFor='recurring-day'>Todo dia</Label>
                <div className='relative'>
                  <Calendar className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                  <Input
                    id='recurring-day'
                    type='number'
                    min='1'
                    max='31'
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className='pl-12 pr-2 text-xs'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS: salvar é o adesivo neutro (a cor do tipo já está no seletor e no valor) */}
          <div className='pt-4 flex gap-3'>
            <Button
              variant='outline'
              size='lg'
              onClick={onClose}
              className='flex-1 px-4'
            >
              CANCELAR
            </Button>
            <Button
              size='lg'
              onClick={handleSave}
              disabled={saving}
              className='flex-1 px-4'
            >
              {saving ? <Loader2 className='w-4 h-4 animate-spin' /> : 'SALVAR'}
            </Button>
          </div>
        </div>
      </Card>
    </DialogOverlay>
  );
}
