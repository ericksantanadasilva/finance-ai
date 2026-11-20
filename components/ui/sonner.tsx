'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from 'lucide-react';

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Toasts no estilo adesivo: superfície, contorno e sombra dura.
// Sucesso, erro e aviso mudam o contorno/sombra (redefinindo --ink, como o
// botão danger) e têm ícone próprio, então a situação não depende só da cor.
// unstyled: desliga o visual padrão do sonner (o posicionamento e o
// empilhamento continuam com ele).
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      icons={{
        success: <CheckCircle2 className='size-4' />,
        error: <XCircle className='size-4' />,
        warning: <AlertTriangle className='size-4' />,
        info: <Info className='size-4' />,
        loading: <Loader2 className='size-4 animate-spin' />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          // data-[front=false]/data-[expanded=false]: na pilha recolhida, o
          // conteúdo dos toasts de trás fica escondido (o sonner só faz isso
          // no modo com o visual dele)
          toast:
            'group toast flex w-full items-start gap-3 rounded-xl border-2 border-ink bg-surface p-4 pr-10 text-sm font-medium text-foreground shadow-hard data-[expanded=false]:data-[front=false]:*:opacity-0',
          title: 'font-bold leading-snug',
          description: 'mt-0.5 text-xs text-muted-foreground',
          icon: 'mt-0.5 shrink-0',
          success: '[--ink:var(--income)] [&_[data-icon]]:text-income',
          error: '[--ink:var(--expense)] [&_[data-icon]]:text-expense',
          warning: '[--ink:var(--warning)] [&_[data-icon]]:text-warning',
          info: '[&_[data-icon]]:text-muted-foreground',
          // Ação (ex.: "Desfazer"): botão adesivo pequeno
          actionButton:
            'ml-auto shrink-0 self-center rounded-lg border-2 border-ink bg-surface px-2.5 py-1 text-xs font-bold lowercase text-foreground shadow-hard-sm transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none cursor-pointer',
          cancelButton:
            'shrink-0 self-center rounded-lg border-2 border-border-custom px-2.5 py-1 text-xs font-bold lowercase text-muted-foreground cursor-pointer',
          // O sonner tem regras próprias para o X no modo escuro; o "!" garante
          // os tokens nos dois modos
          closeButton:
            'absolute top-2 right-2 flex size-6 items-center justify-center rounded-md border-0! bg-transparent! text-muted-foreground! hover:bg-surface-muted! hover:text-foreground! cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
