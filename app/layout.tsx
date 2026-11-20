import type { Metadata } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './_Components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { UserProvider } from './_Context/UserContext';

// Textos e números
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

// Títulos (monoespaçada)
const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Finance.ai | Seu Assistente Financeiro',
  description: 'Gestão financeira inteligente com IA',
  // Favicon por tema do sistema: a convenção de arquivo (app/icon.png) não
  // aceita media query, por isso o favicon vem daqui. A escura fica por último:
  // navegadores que ignoram o media (ex.: Safari) usam ela, que aparece bem
  // nos dois temas. O ícone da Apple é o arquivo app/apple-icon.png (servido
  // em /apple-icon.png); ele precisa ser listado aqui porque, com `icons`
  // definido, o Next não gera a tag dele sozinho.
  icons: {
    apple: [{ url: '/apple-icon.png', type: 'image/png' }],
    icon: [
      {
        url: '/brand/logo_fn_branco.png',
        type: 'image/png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/brand/logo_fn_preto.png',
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // As variáveis das fontes ficam no <html> porque o Tailwind as lê no :root
    // (--default-font-family, --font-display); no <body> elas não existiam lá.
    <html
      lang='pt-BR'
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body className='antialiased bg-background text-foreground transition-colors duration-300'>
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* O UserProvider envolve o children para que a Sidebar (que está no layout das páginas) 
            e as próprias páginas (como a de Settings) compartilhem o mesmo estado.
          */}
          <UserProvider>{children}</UserProvider>

          <Toaster position='top-center' richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
