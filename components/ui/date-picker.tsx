'use client';

import { useState } from 'react';
import { type VariantProps } from 'class-variance-authority';
import { CalendarDays, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from './calendar';
import { fieldVariants } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

// A data entra e sai como texto 'aaaa-mm-dd' (o mesmo formato do
// <input type="date">), então a lógica e o banco não mudam. A conversão usa a
// data local: new Date('2026-11-20') seria meia-noite UTC e, no Brasil,
// apareceria como o dia anterior.
function parseISODate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

const pad = (n: number) => String(n).padStart(2, '0');

function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toDisplay(date: Date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

type DatePickerProps = VariantProps<typeof fieldVariants> & {
  // 'aaaa-mm-dd' ou '' (sem data)
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  // Mostra "limpar data" no calendário (para campos opcionais)
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

function DatePicker({
  value,
  onChange,
  id,
  placeholder = 'dd/mm/aaaa',
  clearable = false,
  disabled,
  size,
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISODate(value);

  return (
    // modal: o Tab fica preso dentro do calendário enquanto ele está aberto
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          fieldVariants({ size }),
          'flex cursor-pointer items-center gap-3 text-left tabular-nums',
          !selected && 'text-muted-foreground',
          className,
        )}
      >
        <CalendarDays
          className='size-4 shrink-0 text-muted-foreground'
          aria-hidden='true'
        />
        <span className='truncate'>
          {selected ? toDisplay(selected) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className='w-auto p-0'
        // O foco inicial fica com o calendário (autoFocus vai para o dia
        // selecionado ou hoje), não com o primeiro botão do popover
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode='single'
          // required: clicar no dia já selecionado mantém a data (limpar é
          // só pelo botão "limpar data")
          required
          autoFocus
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(toISODate(date));
            setOpen(false);
          }}
        />
        {clearable && selected && (
          <div className='border-t border-border-custom p-2'>
            <button
              type='button'
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className='flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium lowercase text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              <X className='size-3.5' aria-hidden='true' />
              Limpar data
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
