import { Card } from '@/components/ui/card';
import { SkeletonText } from '@/components/ui/skeleton';

// Espelha a estrutura do DashboardClient (mesmos paddings, gaps, breakpoints e
// classes de texto), para cada card ter a altura do card carregado.
// Se o layout do DashboardClient mudar, este arquivo precisa acompanhar.
export default function DashboardSkeleton() {
  return (
    <div className='min-h-screen bg-background p-4 sm:p-8 space-y-6 sm:space-y-8 animate-pulse transition-all duration-300'>
      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-10 lg:pt-0'>
        <div>
          <SkeletonText className='text-xl sm:text-2xl font-black' chars={11} />
          <SkeletonText
            className='text-xs sm:text-sm font-medium'
            chars={38}
            tone='soft'
          />
        </div>
        {/* Altura dos botões reais: py-2.5 + linha text-xs + borda */}
        <div className='flex gap-2 w-full sm:w-auto'>
          <div className='h-9.5 flex-1 sm:flex-none sm:w-36 bg-border-custom rounded-xl'></div>
          <div className='h-9.5 flex-1 sm:flex-none sm:w-24 bg-border-custom rounded-xl'></div>
        </div>
      </div>

      {/* CARDS */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
        <Card className='p-6'>
          <SkeletonText className='text-[10px] font-black mb-1' chars={10} />
          <SkeletonText className='text-2xl sm:text-3xl font-black' chars={9} />
          <SkeletonText
            className='text-[11px] font-bold mt-1'
            chars={22}
            tone='soft'
          />
        </Card>
        {[1, 2].map((i) => (
          <Card key={i} className='p-6 flex justify-between items-center'>
            <div>
              <SkeletonText className='text-[10px] font-black mb-1' chars={8} />
              <SkeletonText className='text-2xl font-black' chars={9} />
            </div>
            <div className='w-8 h-8 rounded-full bg-surface-muted'></div>
          </Card>
        ))}
      </div>

      {/* GRÁFICOS */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8'>
        {/* Fluxo mensal: mesma altura fixa do card real; a área do gráfico
            ocupa só o espaço que sobra (flex-1), sem vazar pela borda */}
        <Card className='lg:col-span-2 p-4 sm:p-6 min-h-87.5 sm:h-112.5 flex flex-col'>
          <div className='flex items-center justify-between mb-8'>
            <SkeletonText className='text-xs sm:text-sm font-black' chars={12} />
            <div className='h-7.25 sm:h-7.5 w-20 bg-surface-muted rounded-lg'></div>
          </div>
          <div className='flex-1 min-h-0 bg-surface-muted rounded-xl border border-dashed border-border-custom'></div>
        </Card>

        {/* Categorias: mesma estrutura do card real, com as 4 categorias padrão */}
        <Card className='p-4 sm:p-6 flex flex-col min-h-100'>
          <div className='flex items-center justify-between mb-1'>
            <SkeletonText className='text-xs sm:text-sm font-black' chars={10} />
            <div className='h-6.25 w-24 bg-surface-muted rounded-lg'></div>
          </div>
          <SkeletonText
            className='text-[10px] font-bold mb-6'
            chars={16}
            tone='soft'
          />

          {/* Rosca: diâmetro e espessura iguais aos do gráfico (raios 85 e 65) */}
          <div className='h-48 sm:h-56 flex items-center justify-center'>
            <div className='size-42.5 rounded-full border-20 border-surface-muted'></div>
          </div>

          <div className='mt-6 space-y-3 flex-1'>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 rounded-full bg-border-custom'></div>
                  <SkeletonText
                    className='text-[11px] font-bold'
                    chars={10}
                    tone='soft'
                  />
                </div>
                <SkeletonText className='text-[11px] font-black' chars={8} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
