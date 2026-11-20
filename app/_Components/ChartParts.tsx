import { ArrowDown, ArrowUp } from 'lucide-react';
import type { TooltipContentProps } from 'recharts';
import type {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';

// Peças do gráfico de barras da Visão Geral no estilo "adesivo".
// As cores vêm por style (var()), que funciona em qualquer navegador;
// var() em atributos SVG (fill="var(--x)") não é garantido.

export const SERIES = {
  receitas: {
    label: 'Receitas',
    Icon: ArrowUp,
    color: 'var(--income)',
    className: 'text-income',
  },
  despesas: {
    label: 'Despesas',
    Icon: ArrowDown,
    color: 'var(--expense)',
    className: 'text-expense',
  },
} as const;

export type SeriesKey = keyof typeof SERIES;

type StickerBarProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  series: SeriesKey;
};

// Props que o Recharts passa para a shape de cada barra
type BarShapeProps = Omit<StickerBarProps, 'series'>;

// O Recharts tipa as props da shape como unknown, mas em tempo de execução
// entrega a geometria da barra (x, y, width, height).
export function stickerShape(series: SeriesKey) {
  return function StickerShape(props: unknown) {
    return <StickerBar {...(props as BarShapeProps)} series={series} />;
  };
}

// Caminho de um retângulo com só os cantos de cima arredondados
// (a base fica reta, apoiada no eixo).
function topRoundedPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
}

const SHADOW = 3;

// Barra com contorno ink de 2px e sombra dura deslocada para a direita.
// A sombra termina na linha de base, para não "vazar" para baixo do eixo.
export function StickerBar({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  series,
}: StickerBarProps) {
  if (width <= 0 || height <= 0) return <g />;

  // Recuo de 1px: o traço de 2px fica todo dentro da área da barra
  const bx = x + 1;
  const by = y + 1;
  const bw = Math.max(width - 2, 0);
  const bh = Math.max(height - 1, 0);

  return (
    <g>
      {bh > SHADOW && (
        <path
          d={topRoundedPath(bx + SHADOW, by + SHADOW, bw, bh - SHADOW)}
          style={{ fill: 'var(--ink)' }}
        />
      )}
      <path
        d={topRoundedPath(bx, by, bw, bh)}
        style={{
          fill: SERIES[series].color,
          stroke: 'var(--ink)',
          strokeWidth: 2,
        }}
      />
    </g>
  );
}

type ChartTooltipProps = Partial<TooltipContentProps<ValueType, NameType>> & {
  formatValue: (value: number) => string;
};

// Tooltip "adesivo": superfície, contorno e sombra dura.
// Receita/despesa têm seta além da cor; o valor fica na cor do texto.
export function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className='min-w-40 rounded-xl border-2 border-ink bg-surface px-3 py-2 text-foreground shadow-hard'>
      <p className='font-display text-xs font-bold lowercase mb-1.5'>
        {label}
      </p>
      <ul className='space-y-1'>
        {payload.map((item) => {
          const series = SERIES[item.dataKey as SeriesKey];
          if (!series) return null;
          return (
            <li
              key={series.label}
              className='flex items-center justify-between gap-4 text-xs'
            >
              <span className='flex items-center gap-1.5 font-medium text-muted-foreground lowercase'>
                <series.Icon
                  className={`size-3.5 ${series.className}`}
                  aria-hidden='true'
                />
                {series.label}
              </span>
              <span className='font-bold tabular-nums'>
                {formatValue(Number(item.value ?? 0))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Legenda das duas séries: amostra com contorno + seta + nome.
export function ChartLegend() {
  return (
    <ul className='flex items-center gap-4 mb-4 text-xs font-medium text-muted-foreground lowercase'>
      {(Object.keys(SERIES) as SeriesKey[]).map((key) => {
        const series = SERIES[key];
        return (
          <li key={key} className='flex items-center gap-1.5'>
            <span
              className='size-3 rounded-sm border-2 border-ink'
              style={{ backgroundColor: series.color }}
              aria-hidden='true'
            />
            <series.Icon
              className={`size-3.5 ${series.className}`}
              aria-hidden='true'
            />
            {series.label}
          </li>
        );
      })}
    </ul>
  );
}
