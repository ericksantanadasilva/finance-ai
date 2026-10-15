import AIImportClient from '@/app/_Components/AIImportClient';
import { Sparkles } from 'lucide-react';

export default function AIImportPage() {
  return (
    /* Ajustado: bg-background e text-foreground */
    <div className='min-h-screen bg-background text-foreground font-sans p-4 sm:p-8 flex justify-center transition-colors duration-300'>
      <div className='max-w-4xl w-full space-y-8 pt-12 lg:pt-0'>
        <div className='text-center space-y-2'>
          {/* Badge Gemini: Mais elegante no modo claro */}
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-100 dark:border-purple-500/20 mb-2 shadow-sm'>
            <Sparkles className='w-3 h-3' />
            <span>Powered by Gemini 2.5 Flash</span>
          </div>

          {/* Título com Gradiente Adaptativo */}
          <h1 className='text-3xl sm:text-4xl font-black bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent tracking-tight'>
            Importação Inteligente
          </h1>
          <p className='text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm max-w-md mx-auto font-medium'>
            Transforme seus extratos bancários em dados organizados
            automaticamente com nossa IA.
          </p>
        </div>

        {/* CHAMADA DO CLIENTE */}
        <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
          <AIImportClient />
        </div>
      </div>
    </div>
  );
}
