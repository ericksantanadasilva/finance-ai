'use client';

import { DayPicker, type ChevronProps } from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Calendário baseado no do shadcn (react-day-picker), em pt-BR e com a
// semana começando no domingo. Todo o visual sai dos tokens:
// - dia selecionado: adesivo magenta (highlight) com contorno ink;
// - hoje: contorno ink (não depende só de cor);
// - teclado (setas, Home/End, PageUp/PageDown, Enter) vem do react-day-picker.
function CalendarChevron({ orientation, className }: ChevronProps) {
  const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
  return <Icon className={cn('size-4', className)} aria-hidden='true' />;
}

const navButton =
  'inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={ptBR}
      weekStartsOn={0}
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'relative flex flex-col',
        month: 'space-y-3',
        nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
        button_previous: navButton,
        button_next: navButton,
        month_caption: 'flex h-8 items-center justify-center',
        caption_label: 'font-display text-sm font-bold lowercase',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'w-9 text-center text-xs font-medium lowercase text-muted-foreground',
        week: 'mt-1 flex w-full',
        day: 'size-9 p-0 text-center',
        day_button:
          'inline-flex size-9 items-center justify-center rounded-lg border-2 border-transparent text-sm font-medium tabular-nums transition-colors hover:bg-surface-muted outline-none focus-visible:ring-2 focus-visible:ring-ring',
        today: '[&>button]:border-ink [&>button]:font-bold',
        selected:
          '[&>button]:border-ink [&>button]:bg-highlight [&>button]:font-bold [&>button]:text-highlight-foreground [&>button]:hover:bg-highlight',
        outside: 'text-muted-foreground',
        disabled: 'opacity-50 [&>button]:cursor-not-allowed',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{ Chevron: CalendarChevron }}
      {...props}
    />
  );
}

export { Calendar };
