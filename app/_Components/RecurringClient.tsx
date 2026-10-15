'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Repeat,
  Pause,
  Play,
  Trash2,
  X,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Tag,
  Calendar,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createRecurringRule,
  toggleRecurringRule,
  deleteRecurringRule,
  type RecurringRuleItem,
} from '@/app/_actions/recurring';
import ConfirmDialog from '@/app/_Components/ConfirmDialog';

const formatMoney = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v,
  );

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function RecurringClient({
  initialRules,
  categoryNames,
}: {
  initialRules: RecurringRuleItem[];
  categoryNames: string[];
}) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('5');
  const [startMonth, setStartMonth] = useState(currentMonth());

  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const active = initialRules.filter((r) => r.active);
  const monthlyExpense = active
    .filter((r) => r.type === 'expense')
    .reduce((acc, r) => acc + r.amount, 0);
  const monthlyIncome = active
    .filter((r) => r.type === 'income')
    .reduce((acc, r) => acc + r.amount, 0);

  const reset = () => {
    setDescription('');
    setAmount('');
    setType('expense');
    setCategory('');
    setDayOfMonth('5');
    setStartMonth(currentMonth());
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await createRecurringRule({
        description,
        amount: Number(amount),
        type,
        category,
        dayOfMonth: Number(dayOfMonth),
        startMonth,
      });
      if (res.success) {
        toast.success('Recorrência criada!');
        setIsOpen(false);
        reset();
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

  const handleToggle = async (rule: RecurringRuleItem) => {
    setBusyId(rule.id);
    try {
      await toggleRecurringRule(rule.id, !rule.active);
      toast.success(rule.active ? 'Recorrência pausada.' : 'Recorrência retomada.');
      router.refresh();
    } catch {
      toast.error('Erro ao atualizar.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRecurringRule(ruleToDelete);
      toast.success('Recorrência excluída. O histórico foi mantido.');
      router.refresh();
    } catch {
      toast.error('Erro ao excluir.');
    } finally {
      setIsDeleting(false);
      setRuleToDelete(null);
    }
  };

  // Mesmas categorias padrão do TransactionDialog + as do usuário
  const allCategories = useMemo(
    () =>
      Array.from(
        new Set([
          'Alimentação',
          'Lazer',
          'Transporte',
          'Saúde',
          ...categoryNames,
        ]),
      ).sort(),
    [categoryNames],
  );

  // Opções de mês de início (12 meses atrás até 6 à frente)
  const startMonthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = -12; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

  return (
    <div className='min-h-screen bg-background text-foreground p-4 sm:p-8 transition-colors duration-300'>
      <ConfirmDialog
        isOpen={!!ruleToDelete}
        onClose={() => setRuleToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title='Excluir Recorrência'
        description='Novos lançamentos deixarão de ser gerados. As transações já criadas continuam no seu histórico.'
      />

      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-12 lg:pt-0'>
        <div>
          <h1 className='text-xl sm:text-2xl font-black uppercase tracking-tight'>
            Recorrentes
          </h1>
          <p className='text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium'>
            Contas fixas e receitas mensais lançadas automaticamente.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className='w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-xs font-black tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 uppercase'
        >
          <Plus className='w-4 h-4' /> Nova recorrência
        </button>
      </div>

      {/* RESUMO */}
      <div className='grid grid-cols-2 gap-3 mb-6'>
        <div className='bg-surface border border-border-custom rounded-2xl p-4'>
          <p className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
            Despesas fixas / mês
          </p>
          <p className='text-sm sm:text-lg font-black text-rose-600'>
            {formatMoney(monthlyExpense)}
          </p>
        </div>
        <div className='bg-surface border border-border-custom rounded-2xl p-4'>
          <p className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
            Receitas fixas / mês
          </p>
          <p className='text-sm sm:text-lg font-black text-emerald-600'>
            {formatMoney(monthlyIncome)}
          </p>
        </div>
      </div>

      {/* LISTA */}
      {initialRules.length === 0 ? (
        <div className='bg-surface border border-dashed border-border-custom rounded-2xl p-12 text-center space-y-3'>
          <Repeat className='w-8 h-8 mx-auto text-zinc-400' />
          <p className='text-sm font-bold text-zinc-500'>
            Nenhuma recorrência ainda. Cadastre aluguel, assinaturas ou salário
            e eles entram sozinhos todo mês.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {initialRules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-surface border border-border-custom rounded-2xl p-5 shadow-sm transition-all ${rule.active ? '' : 'opacity-60'}`}
            >
              <div className='flex justify-between items-start gap-3'>
                <div className='flex items-center gap-3 min-w-0'>
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${rule.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}
                  >
                    {rule.type === 'income' ? (
                      <ArrowDownLeft className='w-4 h-4 text-emerald-600' />
                    ) : (
                      <ArrowUpRight className='w-4 h-4 text-rose-600' />
                    )}
                  </div>
                  <div className='min-w-0'>
                    <p className='font-bold text-sm truncate'>
                      {rule.description}
                    </p>
                    <p className='text-[10px] font-bold text-zinc-500 uppercase'>
                      Todo dia {rule.dayOfMonth} ·{' '}
                      {rule.category?.name ?? 'Sem categoria'}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-black text-sm shrink-0 ${rule.type === 'income' ? 'text-emerald-600' : 'text-foreground'}`}
                >
                  {rule.type === 'expense' ? '- ' : ''}
                  {formatMoney(rule.amount)}
                </p>
              </div>

              <div className='mt-4 flex items-center justify-between'>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${rule.active ? 'text-emerald-600' : 'text-zinc-400'}`}
                >
                  {rule.active ? 'Ativa' : 'Pausada'}
                  {rule.lastGeneratedMonth
                    ? ` · último lançamento ${rule.lastGeneratedMonth.split('-').reverse().join('/')}`
                    : ''}
                </span>
                <div className='flex items-center gap-1'>
                  <button
                    onClick={() => handleToggle(rule)}
                    disabled={busyId === rule.id}
                    aria-label={rule.active ? 'Pausar' : 'Retomar'}
                    className='p-2 rounded-xl text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50'
                  >
                    {busyId === rule.id ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : rule.active ? (
                      <Pause className='w-4 h-4' />
                    ) : (
                      <Play className='w-4 h-4' />
                    )}
                  </button>
                  <button
                    onClick={() => setRuleToDelete(rule.id)}
                    aria-label='Excluir recorrência'
                    className='p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO (mesmo layout do TransactionDialog) */}
      {isOpen && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
          <div className='w-full max-w-md bg-surface border border-border-custom rounded-2xl shadow-2xl flex flex-col max-h-[90vh]'>
            {/* HEADER */}
            <div className='flex justify-between items-center p-6 border-b border-border-custom'>
              <h2 className='text-lg font-black text-foreground uppercase tracking-tight'>
                Nova Recorrência
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                aria-label='Fechar'
                className='text-zinc-400 hover:text-foreground transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='p-6 overflow-y-auto custom-scrollbar space-y-6'>
              {/* TIPO */}
              <div className='grid grid-cols-2 gap-2 p-1.5 bg-background border border-border-custom rounded-xl'>
                <button
                  type='button'
                  onClick={() => setType('income')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    type === 'income'
                      ? 'bg-surface text-emerald-600 shadow-sm border border-border-custom'
                      : 'text-zinc-500'
                  }`}
                >
                  <ArrowUpCircle className='w-4 h-4' /> RECEITA
                </button>
                <button
                  type='button'
                  onClick={() => setType('expense')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    type === 'expense'
                      ? 'bg-surface text-rose-600 shadow-sm border border-border-custom'
                      : 'text-zinc-500'
                  }`}
                >
                  <ArrowDownCircle className='w-4 h-4' /> DESPESA
                </button>
              </div>

              {/* VALOR */}
              <div className='space-y-2'>
                <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                  Valor
                </label>
                <div className='relative'>
                  <span className='absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400'>
                    R$
                  </span>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ color: type === 'income' ? '#10b981' : '#e11d48' }}
                    className='w-full bg-background border border-border-custom rounded-xl pl-12 pr-4 py-4 text-2xl font-black outline-none focus:ring-2 focus:ring-emerald-500/10'
                  />
                </div>
              </div>

              {/* INÍCIO (mesmo estilo do Mês de Competência) */}
              <div className='p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-3'>
                <div className='flex items-center gap-2 text-emerald-600 dark:text-emerald-500'>
                  <Clock className='w-4 h-4' />
                  <label className='text-[10px] font-black uppercase tracking-widest'>
                    Começa em
                  </label>
                </div>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className='w-full bg-surface border border-border-custom rounded-lg px-3 py-2 text-xs font-bold outline-none cursor-pointer'
                >
                  {startMonthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className='text-[9px] text-zinc-500 font-medium'>
                  * Meses anteriores ao atual entram como pagos; o mês atual
                  fica pendente até você marcar como pago.
                </p>
              </div>

              <div className='space-y-4'>
                {/* DESCRIÇÃO */}
                <div className='space-y-2'>
                  <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                    Descrição
                  </label>
                  <div className='relative'>
                    <FileText className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
                    <input
                      type='text'
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder='Ex: Aluguel, Netflix, Salário...'
                      className='w-full bg-background border border-border-custom rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none placeholder:text-zinc-500 placeholder:font-medium'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  {/* CATEGORIA */}
                  <div className='space-y-2'>
                    <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                      Categoria
                    </label>
                    <div className='relative'>
                      <Tag className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className='w-full bg-background border border-border-custom rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold outline-none appearance-none'
                      >
                        <option value='' disabled>
                          Selecionar...
                        </option>
                        {allCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* DIA DO MÊS */}
                  <div className='space-y-2'>
                    <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                      Todo dia
                    </label>
                    <div className='relative'>
                      <Calendar className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
                      <input
                        type='number'
                        min='1'
                        max='31'
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(e.target.value)}
                        className='w-full bg-background border border-border-custom rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold outline-none'
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className='pt-4 flex gap-3'>
                <button
                  type='button'
                  onClick={() => setIsOpen(false)}
                  className='flex-1 py-4 bg-background border border-border-custom rounded-xl text-xs font-bold text-zinc-500'
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className={`flex-1 py-4 text-white rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 ${
                    type === 'income' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {saving ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    'SALVAR'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
