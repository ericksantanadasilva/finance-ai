import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './_Components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { UserProvider } from './_Context/UserContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Finance.ai | Seu Assistente Financeiro',
  description: 'Gestão financeira inteligente com IA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='pt-BR' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground transition-colors duration-300`}
      >
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
