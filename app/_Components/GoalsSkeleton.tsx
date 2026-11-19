// app/_Components/GoalsSkeleton.tsx
import { Card } from '@/components/ui/card';

export default function GoalsSkeleton() {
  return (
    <div className='min-h-screen bg-background p-4 sm:p-8 space-y-8 animate-pulse transition-all duration-300'>
      {/* HEADER SKELETON */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-12 lg:pt-0'>
        <div className='space-y-2'>
          <div className='h-8 w-40 bg-border-custom rounded-xl'></div>
          <div className='h-4 w-60 bg-surface-muted rounded-lg'></div>
        </div>
        <div className='h-10 w-full sm:w-32 bg-border-custom rounded-xl'></div>
      </div>

      {/* GRID DE METAS SKELETON */}
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className='p-6 space-y-6'>
            {/* Ícone da Meta */}
            <div className='w-12 h-12 rounded-xl bg-surface-muted'></div>

            {/* Título da Meta */}
            <div className='h-5 w-2/3 bg-border-custom rounded-lg'></div>

            {/* Valores (Atual vs Objetivo) */}
            <div className='flex justify-between items-end'>
              <div className='space-y-2'>
                <div className='h-3 w-12 bg-surface-muted rounded'></div>
                <div className='h-6 w-24 bg-border-custom rounded-lg'></div>
              </div>
              <div className='space-y-2 flex flex-col items-end'>
                <div className='h-3 w-12 bg-surface-muted rounded'></div>
                <div className='h-5 w-20 bg-surface-muted rounded-lg'></div>
              </div>
            </div>

            {/* Barra de Progresso e Prazo */}
            <div className='space-y-3'>
              <div className='h-3 w-full bg-surface-muted rounded-full'></div>
              <div className='flex justify-between items-center'>
                <div className='h-3 w-20 bg-surface-muted rounded'></div>
                <div className='h-4 w-10 bg-border-custom rounded'></div>
              </div>
            </div>

            {/* Botão de Depósito Rápido */}
            <div className='h-11 w-full bg-surface-muted border-2 border-border-custom rounded-xl'></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
