import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SkeletonText } from '@/components/ui/skeleton';
import { StatCardSkeleton } from './StatCard';

// Espelha a estrutura do DashboardClient (mesmos componentes, paddings, gaps,
// breakpoints e classes de texto), para cada card ter a altura do card carregado.
// Se o layout do DashboardClient mudar, este arquivo precisa acompanhar.

export default function DashboardSkeleton() {
  return (
    <div className='min-h-screen bg-background p-4 sm:p-8 space-y-6 sm:space-y-8 animate-pulse transition-all duration-300'>
      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-10 lg:pt-0'>
        <div>
          <SkeletonText className='font-display text-xl sm:text-2xl font-bold' chars={11} />
          <SkeletonText
            className='text-xs sm:text-sm font-medium'
            chars={38}
            tone='soft'
          />
        </div>
        {/* Botões reais: size md (h-11), com contorno */}
        <div className='flex gap-3 w-full sm:w-auto'>
          <div className='h-11 flex-1 sm:flex-none sm:w-36 bg-border-custom rounded-xl'></div>
          <div className='h-11 flex-1 sm:flex-none sm:w-24 bg-border-custom rounded-xl'></div>
        </div>
      </div>

      {/* CARDS */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
        <StatCardSkeleton hasNote />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* GRÁFICOS */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8'>
        {/* Fluxo mensal: faixa com o select (size sm, h-8) e a área do gráfico */}
        <Card className='lg:col-span-2 flex flex-col'>
          <CardHeader>
            <SkeletonText className='font-display font-bold' chars={12} />
            <div className='h-8 w-24 bg-surface rounded-xl'></div>
          </CardHeader>
          <CardContent className='flex-1 flex flex-col p-4 sm:p-6'>
            {/* Legenda (receitas / despesas) */}
            <SkeletonText
              className='text-xs font-medium mb-4'
              chars={24}
              tone='soft'
            />
            <div className='flex-1 min-h-72 sm:min-h-80 bg-surface-muted rounded-xl'></div>
          </CardContent>
        </Card>

        {/* Categorias: mesma estrutura do card real, com as 4 categorias padrão */}
        <Card className='flex flex-col min-h-100'>
          <CardHeader>
            <SkeletonText className='font-display font-bold' chars={10} />
            <div className='h-8 w-32 bg-surface rounded-xl'></div>
          </CardHeader>
          <CardContent className='flex-1 flex flex-col p-4 sm:p-6'>
            <SkeletonText
              className='text-xs font-medium mb-4'
              chars={16}
              tone='soft'
            />

            {/* Rosca: diâmetro e espessura iguais aos do gráfico (raios 85 e 65) */}
            <div className='h-48 sm:h-56 flex items-center justify-center'>
              <div className='size-42.5 rounded-full border-20 border-surface-muted'></div>
            </div>

            <div className='mt-6 space-y-3 flex-1'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='flex justify-between items-center gap-3'>
                  <div className='flex items-center gap-2'>
                    <div className='size-3 rounded-full bg-border-custom'></div>
                    <SkeletonText
                      className='text-xs font-medium'
                      chars={10}
                      tone='soft'
                    />
                  </div>
                  <SkeletonText className='text-xs font-bold' chars={8} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
