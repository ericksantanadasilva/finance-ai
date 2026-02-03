export default function TransactionsSkeleton() {
  return (
    <div className='min-h-screen bg-background p-4 sm:p-8 space-y-6 animate-pulse transition-colors duration-300'>
      {/* HEADER SKELETON */}
      <div className='flex flex-col sm:flex-row justify-between items-start gap-4 pt-12 sm:pt-0'>
        <div className='space-y-3'>
          {/* Título */}
          <div className='h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg'></div>
          {/* Subtítulo */}
          <div className='h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg'></div>
        </div>
        {/* Botão Nova Transação */}
        <div className='h-12 w-full sm:w-44 bg-zinc-200 dark:bg-zinc-800 rounded-xl'></div>
      </div>

      {/* SEARCH BAR SKELETON */}
      <div className='h-16 w-full bg-surface border border-border-custom rounded-2xl shadow-sm'></div>

      {/* TABLE SKELETON */}
      <div className='bg-surface border border-border-custom rounded-2xl overflow-hidden shadow-sm'>
        {/* Header da Tabela (Desktop) */}
        <div className='hidden sm:grid grid-cols-4 p-4 border-b border-border-custom bg-zinc-50 dark:bg-zinc-900/50'>
          <div className='h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded'></div>
          <div className='h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto'></div>
          <div className='h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto'></div>
          <div className='h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto'></div>
        </div>

        {/* Linhas da Tabela */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className='h-20 border-b border-border-custom flex items-center px-6 gap-4 sm:grid sm:grid-cols-4'
          >
            {/* Descrição e Ícone */}
            <div className='flex items-center gap-3 flex-1 sm:flex-none'>
              <div className='h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 shrink-0'></div>
              <div className='h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded'></div>
            </div>

            {/* Data (Desktop) */}
            <div className='hidden sm:flex justify-center'>
              <div className='h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded'></div>
            </div>

            {/* Tipo (Desktop) */}
            <div className='hidden sm:flex justify-center'>
              <div className='h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg'></div>
            </div>

            {/* Valor */}
            <div className='flex flex-col items-end gap-2 ml-auto sm:ml-0'>
              <div className='h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded'></div>
              <div className='h-3 w-16 bg-zinc-100 dark:bg-zinc-900 rounded sm:hidden'></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
