export default function DashboardSkeleton() {
  return (
    <div className='min-h-screen bg-background p-4 sm:p-8 space-y-8 animate-pulse transition-all duration-300'>
      {/* Header Skeleton */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-10 lg:pt-0'>
        <div className='space-y-3'>
          {/* Título e Subtítulo */}
          <div className='h-8 w-48 bg-zinc-200 dark:bg-zinc-900 rounded-xl'></div>
          <div className='h-4 w-64 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg'></div>
        </div>
        <div className='flex gap-2 w-full sm:w-auto'>
          <div className='h-10 flex-1 sm:w-32 bg-zinc-200 dark:bg-zinc-900 rounded-xl'></div>
          <div className='h-10 flex-1 sm:w-24 bg-zinc-200 dark:bg-zinc-900 rounded-xl'></div>
        </div>
      </div>

      {/* Cards Skeleton (Resumo Financeiro) */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='h-32 bg-surface border border-border-custom rounded-2xl shadow-sm dark:shadow-none'
          >
            <div className='p-6 space-y-4'>
              <div className='h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full'></div>
              <div className='h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg'></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton (Gráficos) */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Gráfico de Barras */}
        <div className='lg:col-span-2 h-[450px] bg-surface border border-border-custom rounded-2xl p-6 space-y-6 shadow-sm dark:shadow-none'>
          <div className='flex justify-between items-center'>
            <div className='h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg'></div>
            <div className='h-8 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg'></div>
          </div>
          <div className='w-full h-full bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-dashed border-border-custom'></div>
        </div>

        {/* Gráfico de Pizza / Categorias */}
        <div className='h-[450px] bg-surface border border-border-custom rounded-2xl p-6 flex flex-col items-center justify-between shadow-sm dark:shadow-none'>
          <div className='w-full h-5 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-8'></div>
          <div className='h-48 w-48 rounded-full border-8 border-zinc-100 dark:border-zinc-900'></div>
          <div className='w-full space-y-3 mt-8'>
            <div className='h-4 w-full bg-zinc-100 dark:bg-zinc-900 rounded'></div>
            <div className='h-4 w-full bg-zinc-100 dark:bg-zinc-900 rounded'></div>
            <div className='h-4 w-2/3 bg-zinc-100 dark:bg-zinc-900 rounded'></div>
          </div>
        </div>
      </div>
    </div>
  );
}
