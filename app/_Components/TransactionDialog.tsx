'use client';

import React, { useState, useTransition, useEffect, useId } from 'react';
import {
  Tag,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { createTransaction, updateTransaction } from '../_actions/transactions';
import { getCategoryOptions } from '../_actions/categories';
import type { BudgetStatus } from '@/lib/finance/categories';
import { toast } from 'sonner';
import { todayISO } from '@/app/utils/dates';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
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

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: any;
  referenceMonth: string; // Mês vindo do Dashboard ou Filtro
}

export default function TransactionDialog({
  isOpen,
  onClose,
  editData,
  referenceMonth,
}: TransactionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const titleId = useId();
  const paidLabelId = useId();
  const panelRef = useModalBehavior<HTMLDivElement>({ isOpen, onClose });

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(todayISO());
  const [isPaid, setIsPaid] = useState(true);

  // NOVO: Estado para controlar o Mês de Competência dentro do modal
  const [selectedReference, setSelectedReference] = useState(referenceMonth);

  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Gera opções de meses para o seletor de competência (3 meses atrás até 6 meses à frente)
  const referenceOptions = React.useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = -3; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });
      options.push({
        value,
        label: label.charAt(0).toUpperCase() + label.slice(1),
      });
    }
    return options;
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setType(editData.type === 'income' ? 'income' : 'expense');
        setAmount(editData.amount.toString());
        setDescription(editData.description);
        setCategory(editData.category?.name || '');
        setIsPaid(editData.isPaid ?? true);

        // Se for edição, pega o referenceDate real do banco de dados
        if (editData.referenceDate) {
          setSelectedReference(
            new Date(editData.referenceDate).toISOString().slice(0, 7),
          );
        }

        const d = new Date(editData.date);
        setDate(d.toISOString().split('T')[0]);
      } else {
        setType('expense');
        setAmount('');
        setDescription('');
        setCategory('');
        setDate(todayISO());
        setIsPaid(true);
        // Se for novo, usa o que veio do Dashboard (ex: 2026-02)
        setSelectedReference(referenceMonth);
      }

      async function load() {
        setAllCategories(await getCategoryOptions());
      }
      load();
    }
  }, [isOpen, editData, referenceMonth]);

  // A categoria atual da transação editada que não está nas opções é uma
  // arquivada: continua selecionável para ser mantida (decisão 13)
  const archivedCurrent =
    editData?.category?.name &&
    allCategories.length > 0 &&
    !allCategories.includes(editData.category.name)
      ? editData.category.name
      : null;

  async function handleSubmit() {
    if (!amount || !description || !category) {
      toast.warning('Preencha todos os campos!');
      return;
    }

    startTransition(async () => {
      const payload = {
        amount: parseFloat(amount),
        description,
        category,
        date: `${date}T12:00:00`,
        type,
        isPaid,
      };

      // Enviamos o selectedReference que o usuário escolheu no Modal
      const result = editData
        ? await updateTransaction(editData.id, payload, selectedReference)
        : await createTransaction(payload, selectedReference);

      if (result.success) {
        toast.success('Sucesso!');
        const a = (result as { budgetAlert?: BudgetStatus | null })
          .budgetAlert;
        if (a) {
          const fmt = (v: number) =>
            v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const msg =
            a.percent >= 100
              ? `Orçamento de ${a.category} estourado: ${fmt(a.spent)} de ${fmt(a.budget)}.`
              : `${a.category}: ${Math.round(a.percent)}% do orçamento usado (${fmt(a.spent)} de ${fmt(a.budget)}).`;
          toast.warning(msg);
        }
        onClose();
      } else {
        toast.error('Erro ao salvar!');
      }
    });
  }

  if (!isOpen) return null;

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
          <h2 id={titleId} className='text-base font-bold'>
            {editData ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <DialogCloseButton onClick={onClose} />
        </CardHeader>

        <div className='p-6 overflow-y-auto custom-scrollbar space-y-6'>
          {/* TIPO: o selecionado vira "adesivo" na cor do tipo; a seta reforça entrada/saída */}
          <div className='grid grid-cols-2 gap-3'>
            <Button
              variant={type === 'income' ? 'income' : 'ghost'}
              aria-pressed={type === 'income'}
              onClick={() => setType('income')}
              className={
                type === 'income'
                  ? ''
                  : 'border-border-custom text-muted-foreground'
              }
            >
              <ArrowUpCircle className='w-4 h-4' /> RECEITA
            </Button>
            <Button
              variant={type === 'expense' ? 'expense' : 'ghost'}
              aria-pressed={type === 'expense'}
              onClick={() => setType('expense')}
              className={
                type === 'expense'
                  ? ''
                  : 'border-border-custom text-muted-foreground'
              }
            >
              <ArrowDownCircle className='w-4 h-4' /> DESPESA
            </Button>
          </div>

          {/* VALOR */}
          <div className='flex flex-col gap-2'>
            <Label htmlFor='tx-amount'>Valor</Label>
            <div className='relative'>
              <span className='absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground'>
                R$
              </span>
              <Input
                id='tx-amount'
                type='number'
                step='0.01'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`h-16 pl-12 text-2xl font-black ${type === 'income' ? 'text-income' : 'text-expense'}`}
              />
            </div>
          </div>

          {/* SELETOR DE COMPETÊNCIA (O MÊS QUE APARECE NO DASHBOARD) */}
          <div className='p-4 bg-surface-muted border-2 border-ink rounded-xl space-y-3'>
            <div className='flex items-center gap-2'>
              <Clock className='w-4 h-4' />
              <Label htmlFor='tx-reference'>Mês de Competência</Label>
            </div>
            <Select
              value={selectedReference}
              onValueChange={setSelectedReference}
            >
              <SelectTrigger id='tx-reference'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {referenceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground font-medium'>
              * Este é o mês onde este valor será somado nos gráficos.
            </p>
          </div>

          <div className='space-y-4'>
            {/* DESCRIÇÃO */}
            <div className='flex flex-col gap-2'>
              <Label htmlFor='tx-description'>Descrição</Label>
              <div className='relative'>
                <FileText className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                <Input
                  id='tx-description'
                  type='text'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className='pl-12'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              {/* CATEGORIA */}
              <div className='flex flex-col gap-2'>
                <Label htmlFor='tx-category'>Categoria</Label>
                <div className='relative'>
                  <Tag className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id='tx-category' className='pl-12 pr-4 text-xs'>
                      <SelectValue placeholder='Selecionar...' />
                    </SelectTrigger>
                    <SelectContent>
                      {archivedCurrent && (
                        <SelectItem value={archivedCurrent}>
                          {archivedCurrent} (arquivada)
                        </SelectItem>
                      )}
                      {allCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* DATA REAL */}
              <div className='flex flex-col gap-2'>
                <Label htmlFor='tx-date'>Data da Compra</Label>
                <DatePicker
                  id='tx-date'
                  value={date}
                  onChange={setDate}
                  className='text-xs'
                />
              </div>
            </div>
          </div>

          {/* SITUAÇÃO: o pendente usa o mesmo aviso do selo "a pagar/a receber" */}
          <div className='flex flex-col gap-2'>
            <Label id={paidLabelId}>Situação</Label>
            <div
              role='group'
              aria-labelledby={paidLabelId}
              className='grid grid-cols-2 gap-3'
            >
              <Button
                variant={isPaid ? 'default' : 'ghost'}
                aria-pressed={isPaid}
                onClick={() => setIsPaid(true)}
                className={
                  isPaid ? '' : 'border-border-custom text-muted-foreground'
                }
              >
                <CheckCircle2 className='w-4 h-4' />
                {type === 'income' ? 'RECEBIDO' : 'PAGO'}
              </Button>
              <Button
                variant={isPaid ? 'ghost' : 'default'}
                aria-pressed={!isPaid}
                onClick={() => setIsPaid(false)}
                className={
                  isPaid
                    ? 'border-border-custom text-muted-foreground'
                    : 'text-warning [--ink:var(--warning)]'
                }
              >
                <Clock className='w-4 h-4' />
                {type === 'income' ? 'A RECEBER' : 'A PAGAR'}
              </Button>
            </div>
          </div>

          {/* ACTIONS */}
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
              onClick={handleSubmit}
              disabled={isPending}
              className='flex-1 px-4'
            >
              {isPending ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                'SALVAR'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </DialogOverlay>
  );
}
