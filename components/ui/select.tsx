import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { fieldVariants } from './input';

type SelectProps = Omit<React.ComponentProps<'select'>, 'size'> &
  VariantProps<typeof fieldVariants>;

// Select nativo: mantém acessibilidade e o seletor do sistema no mobile.
function Select({ className, size, ...props }: SelectProps) {
  return (
    <select
      className={cn(fieldVariants({ size }), 'cursor-pointer', className)}
      {...props}
    />
  );
}

export { Select };
