// app/_Components/GoalsSkeleton.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SkeletonText } from '@/components/ui/skeleton';

// Espelha a estrutura do GoalsClient (mesmos componentes, paddings, gaps e
// classes de texto). Se o layout do GoalsClient mudar, acompanhe aqui.
export default function GoalsSkeleton() {
  return (
    <div className='min-h-screen bg-background p-4 sm:p-8 animate-pulse transition-all duration-300'>
      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-10 lg:pt-0'>
        <div>
          <SkeletonText
            className='font-display text-xl sm:text-2xl font-bold'
            chars={17}
          />
          <SkeletonText
            className='text-xs sm:text-sm font-medium'
            chars={42}
            tone='soft'
          />
        </div>
        {/* Botão Nova Meta (size md) */}
        <div className='h-11 w-full sm:w-36 bg-border-custom rounded-xl'></div>
      </div>

      {/* GRID DE METAS */}
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className='flex flex-col'>
            {/* Faixa: ícone + nome; a altura vem dos botões de ação (size-8) */}
            <CardHeader className='py-2'>
              <div className='flex items-center gap-2'>
                <div className='size-4 rounded-md bg-border-custom shrink-0'></div>
                <SkeletonText className='font-display font-bold' chars={14} />
              </div>
              <div className='h-8 w-16 rounded-lg bg-border-custom'></div>
            </CardHeader>

            <CardContent className='flex-1 flex flex-col gap-5'>
              {/* Valores (acumulado x objetivo) */}
              <div className='flex justify-between items-end gap-3'>
                <div>
                  <SkeletonText
                    className='text-xs font-medium mb-1'
                    chars={9}
                    tone='soft'
                  />
                  <SkeletonText
                    className='text-2xl font-bold tracking-tight'
                    chars={9}
                  />
                </div>
                <div className='flex flex-col items-end'>
                  <SkeletonText
                    className='text-xs font-medium mb-1'
                    chars={8}
                    tone='soft'
                  />
                  <SkeletonText className='text-sm font-bold' chars={11} />
                </div>
              </div>

              {/* Barra (h-3) e linha de prazo/porcentagem (min-h-6) */}
              <div className='space-y-3'>
                <div className='h-3 w-full rounded-full bg-surface-muted'></div>
                <div className='flex justify-between items-center gap-3 min-h-6'>
                  <SkeletonText
                    className='text-xs font-medium'
                    chars={12}
                    tone='soft'
                  />
                  <SkeletonText className='text-xs font-bold' chars={3} />
                </div>
              </div>

              {/* Botão Adicionar Valor (size md) */}
              <div className='h-11 w-full rounded-xl bg-surface-muted mt-auto'></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
