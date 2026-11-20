import Image from 'next/image';
import { cn } from '@/lib/utils';

// Logo do app no estilo adesivo (contorno ink + sombra dura pequena).
// Acompanha o tema sem inverter: claro usa a versão clara, escuro a escura.
// A troca é feita com o variante dark: do Tailwind (as duas imagens são
// renderizadas e o CSS mostra a do tema atual), então não pisca na hidratação.
//
// O alt é vazio porque a logo sempre aparece ao lado do texto "Finance.ai";
// com alt preenchido o leitor de tela leria o nome duas vezes.
const SIZES = {
  sm: { px: 32, className: 'size-8 rounded-lg' },
  md: { px: 40, className: 'size-10 rounded-[10px]' },
};

export default function BrandLogo({
  size = 'sm',
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { px, className: sizeClass } = SIZES[size];
  // scale-105: as imagens já têm uma borda cinza fina no arredondado; ampliar
  // um pouco e cortar (overflow-hidden) deixa só o contorno ink do adesivo
  const imgClass = 'size-full scale-105 object-cover';

  return (
    <span
      className={cn(
        'relative block shrink-0 overflow-hidden border-2 border-ink shadow-hard-sm',
        sizeClass,
        className,
      )}
    >
      <Image
        src='/brand/logo_fn_branco.png'
        alt=''
        width={px}
        height={px}
        className={cn(imgClass, 'dark:hidden')}
      />
      <Image
        src='/brand/logo_fn_preto.png'
        alt=''
        width={px}
        height={px}
        className={cn(imgClass, 'hidden dark:block')}
      />
    </span>
  );
}
