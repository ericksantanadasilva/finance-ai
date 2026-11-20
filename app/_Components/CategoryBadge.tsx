// Etiqueta de categoria. A cor vem do banco e aparece só no contorno, no fundo
// bem suave e na bolinha; o texto fica na cor do tema, legível nos dois modos.
// O nome aparece como foi cadastrado (sem forçar caixa).
export default function CategoryBadge({
  name,
  color,
}: {
  name?: string | null;
  color?: string | null;
}) {
  // color-mix aceita qualquer formato de cor (hex curto, rgb...), ao contrário
  // de concatenar um alfa no fim do hex
  const base = color || 'var(--muted-foreground)';

  return (
    <span
      className='inline-flex max-w-full items-center gap-1.5 rounded-md border-2 px-2 py-0.5 text-xs font-medium text-foreground'
      style={{
        borderColor: base,
        backgroundColor: `color-mix(in srgb, ${base} 12%, transparent)`,
      }}
    >
      <span
        className='size-2 shrink-0 rounded-full'
        style={{ backgroundColor: base }}
        aria-hidden='true'
      />
      <span className='truncate'>{name || 'Geral'}</span>
    </span>
  );
}
