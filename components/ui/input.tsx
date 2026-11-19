import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Estilo compartilhado por Input e Select, para os campos ficarem idênticos.
const fieldVariants = cva(
  'w-full min-w-0 rounded-xl border-2 border-ink bg-surface font-medium text-foreground placeholder:text-muted-foreground transition-[box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground aria-invalid:border-expense',
  {
    variants: {
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-11 px-4 text-sm',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> &
  VariantProps<typeof fieldVariants>;

function Input({ className, size, ...props }: InputProps) {
  return (
    <input className={cn(fieldVariants({ size }), className)} {...props} />
  );
}

export { Input, fieldVariants };
