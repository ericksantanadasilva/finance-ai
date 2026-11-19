import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

// Fundo escurecido que centraliza o painel do diálogo.
// O z-index fica por conta de cada diálogo (alguns abrem sobre outros).
function DialogOverlay({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-100 flex items-center justify-center bg-overlay p-4',
        className,
      )}
      {...props}
    />
  );
}

// Botão "X" pensado para ficar dentro da faixa (CardHeader), com as cores dela.
function DialogCloseButton({
  className,
  ...props
}: React.ComponentProps<'button'>) {
  return (
    <Button
      variant='ghost'
      size='icon'
      aria-label='Fechar'
      className={cn(
        'size-8 text-band-foreground hover:bg-band-foreground/15',
        className,
      )}
      {...props}
    >
      <X className='w-5 h-5' />
    </Button>
  );
}

export { DialogOverlay, DialogCloseButton };
