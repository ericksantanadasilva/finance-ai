import { Card } from '@/components/ui/card';
import { SkeletonText } from '@/components/ui/skeleton';

// Espelha a estrutura do TransactionsClient: cabeçalho, filtros (duas linhas),
// 3 cards de resumo, tabela de 5 colunas (lista no mobile) e paginação.
// As alturas finas são ajustadas junto com o redesenho da tela.
const ROWS = [1, 2, 3, 4, 5, 6];

export default function TransactionsSkeleton() {
  return (
    <div className='min-h-screen bg-background p-4 sm:p-8 animate-pulse transition-colors duration-300'>
      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-12 sm:pt-0'>
        <div>
          <SkeletonText className='text-xl sm:text-2xl font-black' chars={10} />
          <SkeletonText
            className='text-xs sm:text-sm font-medium'
            chars={36}
            tone='soft'
          />
        </div>
        {/* Botão Nova Transação */}
        <div className='h-10 w-full sm:w-44 bg-border-custom rounded-xl'></div>
      </div>

      {/* FILTROS */}
      <Card className='p-4 mb-6 flex flex-col gap-4'>
        {/* Linha 1: busca + categoria + mês */}
        <div className='flex flex-col lg:flex-row gap-4'>
          <div className='h-11 flex-1 bg-surface-muted rounded-xl'></div>
          <div className='flex flex-wrap sm:flex-nowrap gap-4'>
            <div className='h-11 min-w-40 flex-1 sm:flex-none bg-surface-muted rounded-xl'></div>
            <div className='h-11 min-w-40 flex-1 sm:flex-none bg-surface-muted rounded-xl'></div>
          </div>
        </div>

        {/* Linha 2: chips de tipo e status, faixa de valor e ordenação */}
        <div className='flex flex-col lg:flex-row gap-4 lg:items-center'>
          <div className='flex gap-2'>
            {['w-16', 'w-20', 'w-20'].map((w, i) => (
              <div key={i} className={`h-8 ${w} bg-surface-muted rounded-xl`}></div>
            ))}
          </div>
          <div className='flex gap-2'>
            {['w-28', 'w-22', 'w-16'].map((w, i) => (
              <div key={i} className={`h-8 ${w} bg-surface-muted rounded-xl`}></div>
            ))}
          </div>
          <div className='flex gap-2 items-center'>
            <div className='h-8 w-28 bg-surface-muted rounded-xl'></div>
            <SkeletonText className='text-xs' chars={3} tone='soft' />
            <div className='h-8 w-28 bg-surface-muted rounded-xl'></div>
          </div>
          <div className='h-9 min-w-45 lg:ml-auto bg-surface-muted rounded-xl'></div>
        </div>
      </Card>

      {/* RESUMO: Receitas, Despesas e Saldo */}
      <div className='grid grid-cols-3 gap-3 mb-6'>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='p-4'>
            <SkeletonText className='text-[10px] font-black' chars={8} />
            <SkeletonText className='text-sm sm:text-lg font-black' chars={9} />
          </Card>
        ))}
      </div>

      {/* TABELA */}
      <Card className='overflow-hidden'>
        {/* Desktop: mesma tabela de 5 colunas do real */}
        <div className='hidden md:block'>
          <table className='w-full text-sm text-left border-separate border-spacing-0'>
            <thead className='bg-surface-muted'>
              <tr>
                {['Descrição', 'Categoria', 'Data', 'Valor', 'Ações'].map(
                  (col, i) => (
                    <th
                      key={col}
                      className='px-6 py-4 border-b border-border-custom'
                    >
                      <SkeletonText
                        className={`text-[10px] font-black ${i === 3 ? 'text-right' : i === 4 ? 'text-center' : ''}`}
                        chars={col.length}
                      />
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((i) => (
                <tr key={i}>
                  <td className='px-6 py-4 border-b border-border-custom'>
                    <div className='flex items-center gap-3'>
                      <div className='w-8 h-8 rounded-lg bg-surface-muted shrink-0'></div>
                      <div className='flex flex-col gap-1'>
                        <SkeletonText className='font-bold' chars={16} />
                        <div className='h-4 w-16 bg-surface-muted rounded-md'></div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 border-b border-border-custom'>
                    <div className='h-5 w-20 bg-surface-muted rounded-md'></div>
                  </td>
                  <td className='px-6 py-4 border-b border-border-custom'>
                    <SkeletonText className='text-xs font-bold' chars={8} tone='soft' />
                  </td>
                  <td className='px-6 py-4 border-b border-border-custom'>
                    <SkeletonText className='text-right font-black' chars={9} />
                  </td>
                  <td className='px-6 py-4 border-b border-border-custom'>
                    <div className='mx-auto w-8 h-8 rounded-lg bg-surface-muted'></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: lista em cards, como no real */}
        <div className='md:hidden divide-y divide-border-custom'>
          {ROWS.map((i) => (
            <div key={i} className='p-4 space-y-4'>
              <div className='flex justify-between items-start'>
                <div className='flex items-center gap-3'>
                  <div className='w-9 h-9 rounded-xl bg-surface-muted shrink-0'></div>
                  <div>
                    <SkeletonText className='font-bold text-sm' chars={16} />
                    <SkeletonText
                      className='text-[10px] font-bold'
                      chars={8}
                      tone='soft'
                    />
                    <div className='mt-1 h-4 w-16 bg-surface-muted rounded-md'></div>
                  </div>
                </div>
                <div className='w-8 h-8 rounded-lg bg-surface-muted'></div>
              </div>
              <div className='flex justify-between items-center'>
                <div className='h-5 w-20 bg-surface-muted rounded'></div>
                <SkeletonText className='text-sm font-black' chars={9} />
              </div>
            </div>
          ))}
        </div>

        {/* PAGINAÇÃO */}
        <div className='flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-border-custom'>
          <SkeletonText className='text-[11px] font-bold' chars={20} tone='soft' />
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-xl bg-surface-muted'></div>
            <SkeletonText className='text-[11px] font-black' chars={5} />
            <div className='w-8 h-8 rounded-xl bg-surface-muted'></div>
          </div>
        </div>
      </Card>
    </div>
  );
}
