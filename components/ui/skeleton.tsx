import { cn } from '@/lib/utils';

type SkeletonTextProps = {
  // As mesmas classes de texto do conteúdo real (tamanho, margens),
  // para a linha do skeleton ter exatamente a mesma altura.
  className?: string;
  // Largura aproximada da barra, em caracteres.
  chars?: number;
  tone?: 'strong' | 'soft';
};

// Linha "fantasma": o texto é transparente e o fundo marca a linha.
// Como a altura vem do line-height real, nada pula quando os dados chegam.
function SkeletonText({
  className,
  chars = 12,
  tone = 'strong',
}: SkeletonTextProps) {
  return (
    <div className={className} aria-hidden='true'>
      <span
        className={cn(
          'rounded-md text-transparent select-none',
          tone === 'strong' ? 'bg-border-custom' : 'bg-surface-muted',
        )}
      >
        {'0'.repeat(chars)}
      </span>
    </div>
  );
}

export { SkeletonText };
