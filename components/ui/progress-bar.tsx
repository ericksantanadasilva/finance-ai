import { cn } from '@/lib/utils';

type ProgressBarProps = {
  // 0 a 100; valores acima de 100 enchem a barra (o texto ao lado diz o resto)
  value: number;
  // Nome lido pelo leitor de tela (ex.: "Orçamento de Lazer")
  label: string;
  // Cor do preenchimento, por token (ex.: 'bg-income'). A cor só reforça:
  // quem usa a barra deve mostrar a situação também em texto ou ícone.
  barClassName?: string;
  className?: string;
};

// Barra de progresso no estilo adesivo: trilho com contorno ink e
// preenchimento na cor da situação.
function ProgressBar({
  value,
  label,
  barClassName = 'bg-income',
  className,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div
      role='progressbar'
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn(
        'h-3 w-full rounded-full border-2 border-ink bg-surface-muted overflow-hidden',
        className,
      )}
    >
      <div
        className={cn('h-full transition-all duration-500', barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { ProgressBar };
