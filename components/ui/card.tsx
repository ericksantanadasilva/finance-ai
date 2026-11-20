import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-ink bg-surface text-foreground shadow-hard',
        className,
      )}
      {...props}
    />
  );
}

// Faixa no topo dos cards: um tom acima da superfície, separada pela borda ink.
function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        // Raio interno = raio do card menos a borda de 2px, para a faixa encaixar no contorno
        'flex items-center justify-between gap-3 rounded-t-[calc(var(--radius-2xl)-2px)] border-b-2 border-ink bg-band px-4 py-2.5 text-sm font-medium lowercase text-band-foreground',
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('p-6', className)} {...props} />;
}

export { Card, CardHeader, CardContent };
