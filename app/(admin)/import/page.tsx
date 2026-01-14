import AIImportClient from '@/app/_Components/AIImportClient';
import { Sparkles } from 'lucide-react';

export default function AIImportPage() {
  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-50 font-sans p-8 flex justify-center'>
      <div className='max-w-4xl w-full space-y-8'>
        <div className='text-center space-y-2'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20 mb-2'>
            <Sparkles className='w-3 h-3' />
            <span>Powered by Gemini 1.5 Flash</span>
          </div>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent'>
            Importação Inteligente
          </h1>
        </div>

        {/* CHAMADA DO CLIENTE QUE CRIAMOS */}
        <AIImportClient />
      </div>
    </div>
  );
}
