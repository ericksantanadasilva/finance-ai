import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SkeletonText } from '@/components/ui/skeleton';

// Espelha a estrutura do CategoriesClient (mesmos componentes, paddings, gaps
// e classes de texto). Os cards imitam uma categoria sem limite mensal (botão
// "definir limite"), o caso das categorias padrão. Os alertas de orçamento
// dependem dos dados e não aparecem aqui. Se o layout mudar, acompanhe aqui.
export default function CategoriesSkeleton() {
  return (
    <div className='animate-pulse'>
      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-10 lg:pt-0'>
        <div>
          <SkeletonText
            className='font-display text-xl sm:text-2xl font-bold'
            chars={10}
          />
          <SkeletonText
            className='text-xs sm:text-sm font-medium'
            chars={44}
            tone='soft'
          />
        </div>
        {/* Botão Nova Categoria (size md) */}
        <div className='h-11 w-full sm:w-48 bg-border-custom rounded-xl' />
      </div>

      {/* GRID DE CATEGORIAS */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {[...Array(8)].map((_, i) => (
          <Card key={i} className='flex flex-col'>
            {/* Faixa: bolinha + nome; a altura vem dos botões de ação (size-8) */}
            <CardHeader className='py-2'>
              <div className='flex items-center gap-2'>
                <div className='size-3 rounded-full bg-border-custom shrink-0' />
                <SkeletonText className='font-display font-bold' chars={12} />
              </div>
              <div className='h-8 w-16 rounded-lg bg-border-custom' />
            </CardHeader>
            <CardContent className='flex-1 p-4'>
              {/* Botão "definir limite mensal" (size sm) */}
              <div className='h-9 w-full rounded-xl bg-surface-muted' />
            </CardContent>
          </Card>
        ))}

        {/* CARD TRACEJADO */}
        <div className='min-h-24 border-2 border-dashed border-border-custom p-5 rounded-2xl flex items-center justify-center gap-2'>
          <div className='size-4 bg-surface-muted rounded-full' />
          <SkeletonText className='text-sm font-bold' chars={18} tone='soft' />
        </div>
      </div>
    </div>
  );
}
