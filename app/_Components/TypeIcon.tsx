import { ArrowDown, ArrowUp } from 'lucide-react';

// Seta de entrada/saída: a direção diz o tipo, a cor só reforça.
// O texto escondido dá o tipo para leitores de tela.
export default function TypeIcon({ type }: { type: string }) {
  const isIncome = type === 'income';
  const Icon = isIncome ? ArrowUp : ArrowDown;
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-lg border-2 ${isIncome ? 'border-income text-income' : 'border-expense text-expense'}`}
    >
      <Icon className='w-4 h-4' aria-hidden='true' />
      <span className='sr-only'>{isIncome ? 'Receita' : 'Despesa'}</span>
    </span>
  );
}
