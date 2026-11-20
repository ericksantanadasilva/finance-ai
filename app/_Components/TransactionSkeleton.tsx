import { Card } from '@/components/ui/card';
import { SkeletonText } from '@/components/ui/skeleton';
import { StatCardSkeleton } from './StatCard';

// Espelha a estrutura do TransactionsClient (mesmos componentes, paddings,
// gaps, breakpoints e classes de texto), para a tela não pular quando os dados
// chegam. As linhas imitam um lançamento pago e não recorrente (sem selo de
// status), que é o caso mais comum. Se o layout mudar, este arquivo acompanha.
const ROWS = [1, 2, 3, 4, 5, 6];

const thClass =
  'px-6 py-3 text-xs font-bold lowercase border-b-2 border-ink whitespace-nowrap';

export default function TransactionsSkeleton() {
  return (
    <div className='min-h-screen bg-background p-4 sm:p-8 animate-pulse transition-colors duration-300'>
      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-10 lg:pt-0'>
        <div>
          <SkeletonText
            className='font-display text-xl sm:text-2xl font-bold'
            chars={10}
          />
          <SkeletonText
            className='text-xs sm:text-sm font-medium'
            chars={36}
            tone='soft'
          />
        </div>
        {/* Botão Nova Transação (size md) */}
        <div className='h-11 w-full sm:w-48 bg-border-custom rounded-xl'></div>
      </div>

      {/* FILTROS */}
      <Card className='p-4 mb-6 flex flex-col gap-4'>
        {/* Linha 1: busca + categoria + mês (campos h-11) */}
        <div className='flex flex-col lg:flex-row gap-4'>
          {/* flex-1 só no lg: na coluna (mobile) ele zeraria a altura */}
          <div className='h-11 lg:flex-1 bg-surface-muted rounded-xl'></div>
          <div className='flex flex-wrap sm:flex-nowrap gap-4'>
            <div className='h-11 min-w-40 flex-1 sm:flex-none bg-surface-muted rounded-xl'></div>
            <div className='h-11 min-w-40 flex-1 sm:flex-none bg-surface-muted rounded-xl'></div>
          </div>
        </div>

        {/* Linha 2: chips de tipo e status, faixa de valor e ordenação (h-9) */}
        <div className='flex flex-col lg:flex-row gap-4 lg:items-center lg:flex-wrap'>
          <div className='flex flex-wrap gap-2'>
            {['w-16', 'w-24', 'w-24'].map((w, i) => (
              <div key={i} className={`h-9 ${w} bg-surface-muted rounded-xl`}></div>
            ))}
          </div>
          <div className='flex flex-wrap gap-2'>
            {['w-32', 'w-28', 'w-20'].map((w, i) => (
              <div key={i} className={`h-9 ${w} bg-surface-muted rounded-xl`}></div>
            ))}
          </div>
          <div className='flex gap-2 items-center'>
            <div className='h-9 w-28 bg-surface-muted rounded-xl'></div>
            <SkeletonText className='text-xs' chars={3} tone='soft' />
            <div className='h-9 w-28 bg-surface-muted rounded-xl'></div>
          </div>
          <div className='h-9 min-w-45 lg:ml-auto bg-surface-muted rounded-xl'></div>
        </div>
      </Card>

      {/* RESUMO: Receitas, Despesas e Saldo */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6'>
        {/* Quase sempre há saldo dos meses anteriores, que aparece como nota
            no card de receitas (ou de despesas, se for negativo) */}
        <StatCardSkeleton hasNote />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* TABELA */}
      <Card>
        {/* Desktop: mesma tabela de 5 colunas do real */}
        <div className='hidden md:block'>
          <table className='w-full text-sm text-left border-separate border-spacing-0'>
            <thead className='bg-band'>
              <tr>
                {['Descrição', 'Categoria', 'Data Compra', 'Valor', 'Ações'].map(
                  (col, i) => (
                    <th
                      key={col}
                      className={`${thClass} ${i === 0 ? 'rounded-tl-[calc(var(--radius-2xl)-2px)]' : ''} ${i === 4 ? 'rounded-tr-[calc(var(--radius-2xl)-2px)]' : ''}`}
                    >
                      <SkeletonText
                        className={i === 3 ? 'text-right' : i === 4 ? 'text-center' : ''}
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
                      <div className='size-8 rounded-lg bg-surface-muted shrink-0'></div>
                      <SkeletonText className='font-bold' chars={16} />
                    </div>
                  </td>
                  <td className='px-6 py-4 border-b border-border-custom'>
                    {/* Badge: linha text-xs + py-0.5 + borda 2px */}
                    <div className='h-6 w-24 bg-surface-muted rounded-md'></div>
                  </td>
                  <td className='px-6 py-4 border-b border-border-custom'>
                    <SkeletonText className='text-xs font-medium' chars={10} tone='soft' />
                  </td>
                  <td className='px-6 py-4 border-b border-border-custom'>
                    <SkeletonText className='text-right font-bold' chars={11} />
                  </td>
                  <td className='px-6 py-4 border-b border-border-custom'>
                    <div className='mx-auto size-8 rounded-lg bg-surface-muted'></div>
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
              <div className='flex justify-between items-start gap-3'>
                <div className='flex items-center gap-3'>
                  <div className='size-8 rounded-lg bg-surface-muted shrink-0'></div>
                  <div>
                    <SkeletonText className='font-bold text-sm' chars={16} />
                    <SkeletonText
                      className='text-xs font-medium'
                      chars={10}
                      tone='soft'
                    />
                    {/* O real reserva o mt-1 do selo de status, mesmo vazio */}
                    <div className='mt-1'></div>
                  </div>
                </div>
                <div className='size-8 rounded-lg bg-surface-muted'></div>
              </div>
              <div className='flex justify-between items-center gap-3'>
                <div className='h-6 w-24 bg-surface-muted rounded-md'></div>
                <SkeletonText className='text-sm font-bold' chars={11} />
              </div>
            </div>
          ))}
        </div>

        {/* PAGINAÇÃO */}
        <div className='flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-border-custom'>
          <SkeletonText className='text-xs font-medium' chars={10} tone='soft' />
          <div className='flex items-center gap-2'>
            <div className='size-9 rounded-xl bg-surface-muted'></div>
            <SkeletonText className='text-xs font-bold' chars={5} />
            <div className='size-9 rounded-xl bg-surface-muted'></div>
          </div>
        </div>
      </Card>
    </div>
  );
}
