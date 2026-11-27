'use client';

import { useState } from 'react';
import { Plus, Archive, Pencil, AlertTriangle } from 'lucide-react';
import { archiveCategory } from '../_actions/categories';
import ConfirmDialog from '@/app/_Components/ConfirmDialog'; // Importando nosso dialog
import CategoryDialog from './CategoryDialog';
import CategoryEditDialog from './CategoryEditDialog';
import CategoryBadge from './CategoryBadge';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { cn } from '@/lib/utils';

type CategoryWithBudget = {
  id: string;
  name: string;
  color: string;
  budget: number | null;
  spent: number;
  percent: number | null;
  activeRecurringRules: number;
};

function archiveDescription(category: CategoryWithBudget | null) {
  const base =
    'Ela sai das listas de escolha. As transações já registradas continuam com ela, e os relatórios não mudam.';
  const rules = category?.activeRecurringRules ?? 0;
  if (rules === 0) return base;
  return `${base} ${rules === 1 ? '1 recorrência ativa usa' : `${rules} recorrências ativas usam`} esta categoria e continua${rules === 1 ? '' : 'm'} lançando com ela.`;
}

const formatMoney = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v,
  );

// Faixas do orçamento: a cor reforça, mas o texto (e o ícone de alerta)
// sempre dizem a situação
function budgetTone(percent: number) {
  if (percent >= 100) return { bar: 'bg-expense', text: 'text-expense' };
  if (percent >= 80) return { bar: 'bg-warning', text: 'text-warning' };
  return { bar: 'bg-income', text: 'text-income' };
}

export default function CategoriesClient({
  initialCategories,
}: {
  initialCategories: CategoryWithBudget[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  // ESTADO PARA EDIÇÃO DE LIMITE
  const [budgetTarget, setBudgetTarget] = useState<CategoryWithBudget | null>(
    null,
  );

  // ESTADOS PARA ARQUIVAMENTO
  const [categoryToArchive, setCategoryToArchive] =
    useState<CategoryWithBudget | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const overBudget = initialCategories.filter(
    (c) => c.percent !== null && c.percent >= 100,
  );
  const nearBudget = initialCategories.filter(
    (c) => c.percent !== null && c.percent >= 80 && c.percent < 100,
  );

  const handleConfirmArchive = async () => {
    if (!categoryToArchive) return;

    setIsArchiving(true);
    try {
      const result = await archiveCategory(categoryToArchive.id);
      if (result) {
        toast.success(`Categoria "${categoryToArchive.name}" arquivada.`);
      } else {
        // Já arquivada (ex.: em outra aba ou pelo app)
        toast.error('Esta categoria não está mais disponível.');
      }
    } catch {
      toast.error('Erro ao arquivar categoria.');
    } finally {
      setIsArchiving(false);
      setCategoryToArchive(null);
    }
  };

  return (
    <div>
      {/* DIALOG DE CONFIRMAÇÃO DE ARQUIVAMENTO */}
      <ConfirmDialog
        isOpen={!!categoryToArchive}
        onClose={() => setCategoryToArchive(null)}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
        variant='warning'
        title={`Arquivar "${categoryToArchive?.name ?? ''}"?`}
        description={archiveDescription(categoryToArchive)}
      />

      <CategoryDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* key: o campo do limite começa com o valor atual a cada abertura */}
      <CategoryEditDialog
        key={budgetTarget?.id}
        category={budgetTarget}
        onClose={() => setBudgetTarget(null)}
      />

      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-10 lg:pt-0'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold lowercase'>
            Categorias
          </h1>
          <p className='text-muted-foreground text-xs sm:text-sm font-medium'>
            Gerencie como a Inteligência Artificial organiza seus gastos.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)} className='w-full sm:w-auto'>
          <Plus className='w-4 h-4' /> NOVA CATEGORIA
        </Button>
      </div>

      {/* ALERTAS DE ORÇAMENTO DO MÊS: adesivo na cor da situação */}
      {(overBudget.length > 0 || nearBudget.length > 0) && (
        <div className='mb-6 space-y-3'>
          {overBudget.length > 0 && (
            <BudgetAlert
              tone='expense'
              label='Orçamento estourado este mês:'
              categories={overBudget}
            />
          )}
          {nearBudget.length > 0 && (
            <BudgetAlert
              tone='warning'
              label='Perto do limite (80% ou mais):'
              categories={nearBudget}
            />
          )}
        </div>
      )}

      {/* GRID DE CATEGORIAS */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {initialCategories.map((cat) => (
          <Card key={cat.id} className='group flex flex-col'>
            <CardHeader className='py-2'>
              <h2 className='flex items-center gap-2 min-w-0 font-bold'>
                <span
                  className='size-3 shrink-0 rounded-full border-2 border-ink'
                  style={{ backgroundColor: cat.color }}
                  aria-hidden='true'
                />
                {/* Nome como foi cadastrado (a faixa força minúsculas) */}
                <span className='truncate normal-case' title={cat.name}>
                  {cat.name}
                </span>
              </h2>

              {/* No desktop as ações aparecem no hover ou quando recebem foco */}
              <div className='flex items-center shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setBudgetTarget(cat)}
                  aria-label={`Editar ${cat.name}`}
                  className='size-8 text-muted-foreground hover:text-foreground'
                >
                  <Pencil className='w-4 h-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setCategoryToArchive(cat)}
                  aria-label={`Arquivar ${cat.name}`}
                  className='size-8 text-muted-foreground hover:text-warning'
                >
                  <Archive className='w-4 h-4' />
                </Button>
              </div>
            </CardHeader>

            <CardContent className='flex-1 p-4'>
              {cat.budget && cat.percent !== null ? (
                <div className='space-y-2'>
                  <div className='flex justify-between gap-2 text-xs font-medium tabular-nums'>
                    <span
                      className={cn('font-bold', budgetTone(cat.percent).text)}
                    >
                      {formatMoney(cat.spent)}
                    </span>
                    <span className='text-muted-foreground'>
                      de {formatMoney(cat.budget)}
                    </span>
                  </div>
                  <ProgressBar
                    value={cat.percent}
                    label={`Orçamento de ${cat.name}`}
                    barClassName={budgetTone(cat.percent).bar}
                  />
                  <p
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-bold',
                      budgetTone(cat.percent).text,
                    )}
                  >
                    {cat.percent >= 80 && (
                      <AlertTriangle
                        className='w-3.5 h-3.5 shrink-0'
                        aria-hidden='true'
                      />
                    )}
                    {cat.percent >= 100
                      ? `Estourou ${formatMoney(cat.spent - cat.budget)}`
                      : `${Math.round(cat.percent)}% usado · restam ${formatMoney(cat.budget - cat.spent)}`}
                  </p>
                </div>
              ) : (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setBudgetTarget(cat)}
                  className='w-full'
                >
                  <Plus className='w-3.5 h-3.5' /> Definir limite mensal
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {/* BOTÃO ADICIONAR (TRACEJADO): ação secundária, plana */}
        <button
          onClick={() => setIsOpen(true)}
          className='min-h-24 border-2 border-dashed border-border-custom p-5 rounded-2xl flex items-center justify-center gap-2 text-muted-foreground cursor-pointer transition-colors hover:border-ink hover:text-foreground hover:bg-surface outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        >
          <Plus className='w-4 h-4' />
          <span className='text-sm font-bold lowercase'>
            Criar Personalizada
          </span>
        </button>
      </div>
    </div>
  );
}

// Alerta de orçamento: contorno e sombra na cor da situação, ícone e texto
// dizem o que aconteceu; as categorias aparecem como CategoryBadge
function BudgetAlert({
  tone,
  label,
  categories,
}: {
  tone: 'expense' | 'warning';
  label: string;
  categories: CategoryWithBudget[];
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-2xl border-2 border-ink bg-surface shadow-hard',
        // Redefine --ink só aqui (mesma técnica do botão danger)
        tone === 'expense'
          ? '[--ink:var(--expense)]'
          : '[--ink:var(--warning)]',
      )}
    >
      <AlertTriangle
        className={cn(
          'w-5 h-5 shrink-0 mt-0.5',
          tone === 'expense' ? 'text-expense' : 'text-warning',
        )}
        aria-hidden='true'
      />
      <div className='flex flex-wrap items-center gap-2 text-sm font-bold text-foreground'>
        <span>{label}</span>
        {categories.map((c) => (
          <CategoryBadge key={c.id} name={c.name} color={c.color} />
        ))}
      </div>
    </div>
  );
}
