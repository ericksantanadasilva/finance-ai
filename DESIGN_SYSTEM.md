# Design System — Finance.ai

Guia visual do app. Toda tela nova ou alterada deve seguir este documento
(ver `AGENTS.md`, seção 10). Se algo aqui não cobrir o caso, prefira reutilizar
um padrão de uma tela existente a inventar um novo.

O estilo é **neo-brutalista**: contornos grossos, sombras duras deslocadas
(sem desfoque), cantos arredondados e cores de destaque usadas com moderação.
Há dois modos, claro e escuro, trocados pelo `next-themes` (classe `.dark` no
`<html>`).

---

## 1. Tokens

Todas as cores ficam em `app/globals.css`, com um valor por modo. Os
componentes usam **só as classes geradas a partir dos tokens** (`bg-surface`,
`border-ink`, `text-income`…).

- **Sem cores fixas** (`bg-zinc-900`, `text-emerald-500`, `#10b981`…).
- **Sem o prefixo `dark:`**: o token já muda sozinho no modo escuro. A única
  exceção é trocar uma **imagem** por modo (ver `BrandLogo`).
- Cada fundo tem um par `-foreground` com a cor de texto legível sobre ele.

### Superfícies e texto

| Token | Uso | Claro | Escuro |
|---|---|---|---|
| `background` | fundo da página | `#f7f7f5` | `#111111` |
| `surface` | cards, campos, diálogos | `#ffffff` | `#1c1c1c` |
| `surface-muted` | faixas, hover, fundos neutros | `#efefec` | `#262626` |
| `foreground` | texto principal | `#111111` | `#f7f7f5` |
| `muted-foreground` | texto secundário, rótulos de apoio | `#52525b` | `#a1a1aa` |

### Contorno e divisórias

| Token | Uso | Claro | Escuro |
|---|---|---|---|
| `ink` | contorno grosso e sombra dura (o "adesivo") | `#111111` | `#f7f7f5` |
| `border-custom` | divisórias finas entre itens | `#e4e4df` | `#2e2e2e` |

`ink` é claro no modo escuro, para a sombra continuar visível sobre o fundo
preto.

### Faixa de cabeçalho

| Token | Valor |
|---|---|
| `band` | `surface-muted` (nos dois modos) |
| `band-foreground` | `foreground` |

### Destaques

| Token | Uso | Claro | Escuro |
|---|---|---|---|
| `highlight` (magenta) | destaque pontual | `#d1157f` | `#ff5cb4` |
| `ai` (roxo) | tudo que é da IA | `#6c3cf0` | `#a98bff` |

### Semânticas

| Token | Uso | Claro | Escuro |
|---|---|---|---|
| `income` | receita, sucesso, "dentro do orçamento" | `#047857` | `#34d399` |
| `expense` | despesa, erro, "estourou" | `#be123c` | `#fb7185` |
| `warning` | aviso, pendente, "perto do limite" | `#b45309` | `#fbbf24` |
| `danger` / `danger-foreground` / `danger-border` | botão destrutivo | preenchido `expense` | superfície com texto e contorno `expense` |
| `overlay` | fundo escurecido de diálogos e da gaveta | `rgb(17 17 17 / .5)` | `rgb(0 0 0 / .7)` |

Todos os pares de texto passam no contraste **WCAG AA** nos dois modos. Ao
criar um par novo, confira o contraste antes de usar.

### Aliases do shadcn

`primary`, `card`, `muted`, `border`, `ring`, `chart-1…5` etc. apontam para os
tokens acima, para não existirem duas paletas. Prefira os nomes próprios
(`surface`, `ink`…) no código novo. O anel de foco (`ring`) é `ai`.

### Sombras e raios

| Classe | Valor |
|---|---|
| `shadow-hard-sm` | `2px 2px 0 0 ink` |
| `shadow-hard` | `4px 4px 0 0 ink` (padrão) |
| `shadow-hard-lg` | `6px 6px 0 0 ink` (diálogos, card de login) |

Raio base `--radius: 0.5rem`. Na prática: `rounded-xl` em campos e botões,
`rounded-2xl` em cards, `rounded-md`/`rounded-lg` em selos e itens pequenos.

**Nunca use sombra com desfoque** (`shadow-lg`, `shadow-2xl`, `blur`).

### Técnica: redefinir `--ink` num elemento

Contorno e sombra seguem `--ink`. Para pintar os dois com outra cor só num
elemento, redefina a variável nele:

```tsx
<Card className='[--ink:var(--expense)]'>  // contorno e sombra vermelhos
```

É assim que funcionam o botão `danger`, os alertas de orçamento, a zona de
perigo de Configurações e os toasts de sucesso/erro/aviso.

---

## 2. Tipografia

| Papel | Fonte | Classe |
|---|---|---|
| Texto e números | Space Grotesk | `font-sans` (padrão) |
| Títulos (`h1`, `h2`) | Space Mono | `font-display` (aplicada automaticamente) |

- As variáveis das fontes ficam no `<html>` (em `app/layout.tsx`), porque o
  Tailwind as lê no `:root`.
- **Valores em dinheiro e números em coluna**: `tabular-nums`, alinhados à
  direita em tabelas.
- Valor grande de resumo: use o `StatCard` (não recrie o tamanho).

---

## 3. Regras de estilo

### Elevação define a hierarquia

| Papel | Visual | Exemplos |
|---|---|---|
| Principal, ativo, selecionado | **adesivo**: contorno `ink` + `shadow-hard` | salvar, confirmar, chip ativo, tema selecionado, regra ativa |
| Secundário, inativo | **plano**: borda fina, sem sombra | cancelar, chip inativo, regra pausada, "definir limite" |

**Nada de bloco chapado da cor `ink` com sombra `ink`.** O fundo e a sombra
viram uma mancha só. Por isso a variante `primary` do `Button` não é usada.

### Faixa de cabeçalho sem inverter

O `CardHeader` usa `bg-band` (um tom acima da superfície) com borda inferior
`ink`, **nos dois modos**. Nunca uma faixa preta no claro ou branca no escuro.

### Cores de destaque

- **Roxo (`ai`) só para IA**: Assistente, Importar IA, botão "importar ia",
  selo do modelo. Nas telas de IA, use como destaque (avatar, borda de balão,
  botão principal), não em tudo.
- **Magenta (`highlight`) é pontual**: dia selecionado no calendário, formas do
  Login. Não use como cor de seção ou de texto corrido.

### Receita e despesa: nunca só cor

Sempre que receita/despesa aparecer, combine o token com uma **seta**:

- `income` + seta para cima (`ArrowUp`, `ArrowUpCircle`, `TypeIcon`)
- `expense` + seta para baixo (`ArrowDown`, `ArrowDownCircle`, `TypeIcon`)

Vale também para estados (concluída, estourou, pendente): ícone ou texto além
da cor.

### Minúsculas

- Títulos, rótulos, botões e faixas em **minúsculas** (`lowercase`), sem
  tracking largo e sem CAIXA ALTA.
- O `Button`, o `Label` e o `CardHeader` já aplicam `lowercase`.
- **Não force caixa em dado do usuário** (nome de categoria, de meta,
  descrição): mostre como foi cadastrado (`normal-case` dentro de uma faixa).
- **"R$" sempre em `normal-case`** quando estiver dentro de algo em minúsculas:

```tsx
<Label>Guardado (<span className='normal-case'>R$</span>)</Label>
```

- Texto corrido (parágrafos, mensagens) fica como escrito; "IA" continua "IA".

### Estados

Toda tela que busca dados trata **carregando, vazio, erro e sucesso**.

- **Carregando**: skeleton com a mesma estrutura e as mesmas alturas da tela
  (ver `SkeletonText` e os `*Skeleton.tsx`).
- **Vazio**: bloco tracejado e plano (`border-2 border-dashed
  border-border-custom`), ícone suave e uma frase (ver Recorrentes e Metas).
- **Erro na tela**: caixa com `border-2 border-expense`, fundo `surface` e
  `AlertTriangle` em `text-expense`; use `role='alert'` se ela substitui um
  toast.
- **Campo inválido**: `aria-invalid` no campo; o `fieldVariants` já pinta o
  contorno de `expense`.

### Animação

- Entradas curtas: **150–200 ms**, deslocamento de no máximo **8px**
  (`slide-in-from-bottom-2`), escala a partir de **95%** (`zoom-in-95`, nunca
  `zoom-in` sozinho, que começa em 0).
- Sem desfoque e sem movimentos longos.
- O `globals.css` desliga entradas e transições com `prefers-reduced-motion`.
  Animações em JavaScript (Recharts) usam o hook `useReducedMotion`.

### Responsivo e acessibilidade

- Toda tela funciona a partir de 360px, **sem rolagem lateral**. Tabelas viram
  lista no mobile (ver Transações).
- Cabeçalho de página com `pt-10 lg:pt-0` (abaixo do `lg` o botão do menu fica
  por cima). O padding da página (`p-4 sm:p-8`) é aplicado **uma vez só**.
- Diálogos usam `useModalBehavior` + `role='dialog'`, `aria-modal`,
  `aria-labelledby`. Rótulos sempre ligados com `htmlFor`/`id`. Botões só de
  ícone têm `aria-label`.

---

## 4. Componentes (`components/ui`)

Reutilize antes de criar. Personalize com `variant`, `size` e `className`.

| Componente | Arquivo | Notas |
|---|---|---|
| `Button` | `button.tsx` | Variantes: `default` (adesivo), `outline` (plano), `ghost`, `ai`, `danger`, `income`, `expense`. Tamanhos: `sm`, `md`, `lg`, `icon`. `primary` existe mas **não é usada** (ver Elevação). |
| `Card`, `CardHeader`, `CardContent` | `card.tsx` | Card adesivo; `CardHeader` é a faixa. |
| `Input` + `fieldVariants` | `input.tsx` | Contorno `ink`, tamanhos `sm`/`md`, estados de foco, `disabled` e `aria-invalid`. |
| `Label` | `label.tsx` | `text-sm font-bold lowercase`. |
| `Select` (+ `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`) | `select.tsx` | Radix; lista em portal no estilo adesivo. Nenhum item com `value=''` (use `placeholder`). |
| `DatePicker` | `date-picker.tsx` | Valor `aaaa-mm-dd`, exibe `dd/mm/aaaa`; `clearable` para campos opcionais. |
| `Calendar` | `calendar.tsx` | react-day-picker em pt-BR, semana começando no domingo. |
| `Popover` | `popover.tsx` | Radix; conteúdo adesivo em portal (`z-120`). |
| `DialogOverlay`, `DialogCloseButton` | `dialog.tsx` | Fundo escurecido e X da faixa. |
| `ProgressBar` | `progress-bar.tsx` | Trilho com contorno; cor por `barClassName`; `role='progressbar'`. |
| `SkeletonText` | `skeleton.tsx` | Linha "fantasma" com as classes do texto real, para a altura bater. |
| `Toaster` | `sonner.tsx` | Toasts adesivos, contorno e ícone por tipo. Sem `richColors`. |

### Componentes compartilhados do app (`app/_Components`)

| Componente | Uso |
|---|---|
| `StatCard` / `StatCardSkeleton` | Card de resumo: faixa com rótulo + ícone, valor grande, nota opcional. |
| `CategoryBadge` | Selo de categoria: a cor do banco no contorno e na bolinha, texto na cor do tema. |
| `TypeIcon` | Seta de receita/despesa num quadrado contornado (com texto para leitor de tela). |
| `BrandLogo` | Logo adesivo; troca a imagem clara/escura pelo tema. |
| `ConfirmDialog` | Confirmação (destrutiva por padrão); aceita `returnFocusRef`. |
| `ChartParts` | Barra, tooltip e legenda dos gráficos no estilo adesivo. |

### Hooks (`hooks/`)

| Hook | Uso |
|---|---|
| `useModalBehavior` | Esc fecha, foco preso, rolagem travada, foco volta a quem abriu. Ignora teclas de camadas em portal (Select, calendário). |
| `useReducedMotion` | `true` quando o sistema pede movimento reduzido. |

### z-index

| Camada | Valor |
|---|---|
| Fundo escurecido da gaveta, painel do Assistente | `z-40` |
| Sidebar / gaveta e botão de menu | `z-50` |
| Diálogos | `z-100` (`DialogOverlay`) |
| `ConfirmDialog` e menu "…" da linha | `z-110` |
| Listas do Select, calendário (portais) | `z-120` |

---

## 5. Checklist para uma tela nova

- [ ] Só tokens, sem cor fixa e sem `dark:`.
- [ ] Principal adesivo, secundário plano; nenhum bloco `ink` com sombra `ink`.
- [ ] Cards com faixa (`CardHeader`) onde houver título.
- [ ] Roxo só se for IA; magenta só pontual.
- [ ] Receita/despesa e estados com ícone ou texto, não só cor.
- [ ] Minúsculas nos rótulos; "R$" e dados do usuário sem caixa forçada.
- [ ] Carregando (skeleton com as mesmas alturas), vazio, erro e sucesso.
- [ ] 360px sem rolagem lateral; testado nos dois modos.
- [ ] Rótulos ligados, botões de ícone com nome, diálogos com
      `useModalBehavior`.
- [ ] Animações curtas e respeitando movimento reduzido.
