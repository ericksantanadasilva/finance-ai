import AIImportClient from '@/app/_Components/AIImportClient';
import { Sparkles } from 'lucide-react';

export default function AIImportPage() {
  return (
    <div className='min-h-screen bg-background text-foreground font-sans p-4 sm:p-8 transition-colors duration-300'>
      {/* HEADER (o único da tela; o AIImportClient não repete o título) */}
      <div className='mb-8 pt-10 lg:pt-0 space-y-2'>
        {/* Selo do modelo: o roxo (ai) marca que a tela é de IA */}
        <span className='inline-flex items-center gap-1.5 rounded-md border-2 border-ai px-2 py-0.5 text-xs font-bold lowercase text-ai'>
          <Sparkles className='w-3.5 h-3.5' aria-hidden='true' />
          Powered by Gemini 2.5 Flash
        </span>
        <h1 className='text-xl sm:text-2xl font-bold lowercase'>
          Importação Inteligente
        </h1>
        <p className='text-muted-foreground text-xs sm:text-sm font-medium'>
          Transforme seus extratos bancários em dados organizados
          automaticamente com nossa IA.
        </p>
      </div>

      {/* CHAMADA DO CLIENTE */}
      <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
        <AIImportClient />
      </div>
    </div>
  );
}
