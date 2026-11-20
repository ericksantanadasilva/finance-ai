'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { type VariantProps } from 'class-variance-authority';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fieldVariants } from './input';

// Select baseado no do shadcn (Radix): o campo fechado tem o mesmo visual dos
// inputs, e a lista aberta é um "adesivo" renderizado num portal.
// O Radix cuida do teclado (setas, Enter, Esc, digitar para buscar) e do ARIA.
// Atenção: nenhum SelectItem pode ter value ''. Para "nada selecionado", use
// value '' no Select e o texto em <SelectValue placeholder='...' />.
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

type SelectTriggerProps = React.ComponentProps<typeof SelectPrimitive.Trigger> &
  VariantProps<typeof fieldVariants>;

function SelectTrigger({
  className,
  size,
  children,
  ...props
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        fieldVariants({ size }),
        'flex cursor-pointer items-center justify-between gap-2 text-left data-placeholder:text-muted-foreground [&>span]:truncate',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className='size-4 shrink-0 text-muted-foreground' />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      {/* z-120: acima dos diálogos (o mais alto, ConfirmDialog, usa z-110) */}
      <SelectPrimitive.Content
        position='popper'
        sideOffset={6}
        className={cn(
          'relative z-120 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-xl border-2 border-ink bg-surface text-foreground shadow-hard',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className='flex h-6 items-center justify-center text-muted-foreground'>
          <ChevronUp className='size-4' />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className='p-1'>
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className='flex h-6 items-center justify-center text-muted-foreground'>
          <ChevronDown className='size-4' />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

// Opção em foco: fundo surface-muted. Selecionada: negrito + check
// (não depende só de cor).
function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pr-8 pl-3 text-sm font-medium outline-none data-highlighted:bg-surface-muted data-[state=checked]:font-bold data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className='absolute right-2 flex items-center'>
        <Check className='size-4' />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
