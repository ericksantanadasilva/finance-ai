import { Card } from '@/components/ui/card';
import { SkeletonText } from '@/components/ui/skeleton';
import { StatCardSkeleton } from './StatCard';

// Espelha a estrutura do RecurringClient (mesmos componentes, paddings, gaps e
// classes de texto). Os cards imitam uma regra ativa que já gerou lançamento.
// Se o layout do RecurringClient mudar, este arquivo precisa acompanhar.
const RULES = [1, 2, 3, 4];

export default function RecurringSkeleton() {
  return (
    <div className='min-h-screen bg-background p-4 sm:p-8 animate-pulse transition-colors duration-300'>
      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-10 lg:pt-0'>
        <div>
          <SkeletonText
            className='font-display text-xl sm:text-2xl font-bold'
            chars={11}
          />
          <SkeletonText
            className='text-xs sm:text-sm font-medium'
            chars={44}
            tone='soft'
          />
        </div>
        {/* Botão Nova recorrência (size md) */}
        <div className='h-11 w-full sm:w-48 bg-border-custom rounded-xl' />
      </div>

      {/* RESUMO */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6'>
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* LISTA */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {RULES.map((i) => (
          <Card key={i} className='p-5'>
            <div className='flex justify-between items-start gap-3'>
              <div className='flex items-center gap-3 min-w-0'>
                <div className='size-8 rounded-lg bg-surface-muted shrink-0' />
                <div className='min-w-0 space-y-1'>
                  <SkeletonText className='font-bold text-sm' chars={16} />
                  {/* "Todo dia" + CategoryBadge (h-6) */}
                  <div className='flex items-center gap-2'>
                    <SkeletonText
                      className='text-xs font-medium'
                      chars={9}
                      tone='soft'
                    />
                    <div className='h-6 w-24 bg-surface-muted rounded-md' />
                  </div>
                </div>
              </div>
              <SkeletonText className='font-bold text-sm' chars={10} />
            </div>

            <div className='mt-4 flex items-center justify-between gap-3'>
              <div className='flex items-center gap-1.5'>
                {/* Selo "ativa" (text-xs + py-0.5 + borda 2px) */}
                <div className='h-6 w-16 bg-surface-muted rounded-md' />
                <SkeletonText
                  className='text-xs font-medium'
                  chars={24}
                  tone='soft'
                />
              </div>
              <div className='flex items-center gap-1'>
                <div className='size-8 rounded-lg bg-surface-muted' />
                <div className='size-8 rounded-lg bg-surface-muted' />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
