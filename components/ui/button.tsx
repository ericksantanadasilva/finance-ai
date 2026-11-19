import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Efeito "adesivo": sombra dura que diminui quando o botão é pressionado,
// dando a impressão de que ele afunda na página.
const pressable =
  'border-ink shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-hard-sm active:translate-x-1 active:translate-y-1 active:shadow-none';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 shrink-0 rounded-xl border-2 font-bold lowercase whitespace-nowrap cursor-pointer transition-[transform,box-shadow,background-color] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: cn(pressable, 'bg-surface text-foreground'),
        primary: cn(pressable, 'bg-primary text-primary-foreground'),
        ai: cn(pressable, 'bg-ai text-ai-foreground'),
        // Redefine --ink só neste botão: contorno e sombra passam a usar --danger-border
        danger: cn(
          pressable,
          'bg-danger text-danger-foreground [--ink:var(--danger-border)]',
        ),
        ghost:
          'border-transparent bg-transparent text-foreground hover:bg-surface-muted',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-8 text-sm',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
