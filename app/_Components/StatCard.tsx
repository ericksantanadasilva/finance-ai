import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SkeletonText } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Valor grande dos cards de resumo. No lg os 3 cards dividem a largura com a
// sidebar, então o número diminui um pouco para caber valores de 6 dígitos.
const statValueClass =
  'text-3xl lg:text-2xl xl:text-3xl font-bold tabular-nums tracking-tight wrap-break-word';

const toneClass = {
  neutral: '',
  income: 'text-income',
  expense: 'text-expense',
};

type StatCardProps = {
  label: string;
  // Receita/despesa: use ArrowUpCircle/ArrowDownCircle, para não depender só da cor
  icon: LucideIcon;
  value: string;
  tone?: keyof typeof toneClass;
  note?: React.ReactNode;
};

// Card de resumo: faixa com o rótulo e o ícone, valor grande embaixo.
function StatCard({
  label,
  icon: Icon,
  value,
  tone = 'neutral',
  note,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className='font-bold'>{label}</h2>
        <Icon className='w-4 h-4' aria-hidden='true' />
      </CardHeader>
      <CardContent>
        <p className={cn(statValueClass, toneClass[tone])}>{value}</p>
        {note && (
          <p className='text-muted-foreground text-xs font-medium mt-1'>
            {note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Mesma estrutura do StatCard, para o skeleton ter a altura do card carregado.
function StatCardSkeleton({ hasNote = false }: { hasNote?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <SkeletonText className='font-display font-bold' chars={10} />
        <div className='size-4 rounded-md bg-border-custom'></div>
      </CardHeader>
      <CardContent>
        <SkeletonText className={statValueClass} chars={9} />
        {hasNote && (
          <SkeletonText
            className='text-xs font-medium mt-1'
            chars={30}
            tone='soft'
          />
        )}
      </CardContent>
    </Card>
  );
}

export { StatCard, StatCardSkeleton };
