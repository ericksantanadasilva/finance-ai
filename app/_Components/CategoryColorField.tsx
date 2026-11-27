'use client';

import { Label } from '@/components/ui/label';

// Seletor de cor da categoria. O input de cor nativo fica invisível por cima
// da amostra: a lógica é a do input, só o visual muda.
export default function CategoryColorField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className='flex flex-col gap-2'>
      <Label htmlFor={id}>Cor de Identificação</Label>
      <div className='flex items-center gap-3 rounded-xl border-2 border-ink bg-surface p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background'>
        <div className='relative size-10 shrink-0'>
          <input
            id={id}
            type='color'
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className='absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10'
          />
          <div
            className='size-full rounded-lg border-2 border-ink'
            style={{ backgroundColor: value }}
          />
        </div>
        <span className='font-mono text-sm font-bold text-muted-foreground lowercase'>
          {value}
        </span>
      </div>
    </div>
  );
}
