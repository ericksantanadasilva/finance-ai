import React from 'react';
import {
  Sparkles,
  UploadCloud,
  FileText,
  ArrowRight,
  Code2,
  Check,
} from 'lucide-react';

export default function AIImportPage() {
  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-50 font-sans p-8 flex justify-center'>
      <div className='max-w-4xl w-full space-y-8'>
        {/* Cabeçalho Focado */}
        <div className='text-center space-y-2'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20 mb-2'>
            <Sparkles className='w-3 h-3' />
            <span>Powered by Gemini 1.5 Flash</span>
          </div>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent'>
            Importação Inteligente
          </h1>
          <p className='text-zinc-400 max-w-lg mx-auto'>
            Cole seu extrato bancário, PDF ou CSV bagunçado abaixo. A IA vai
            limpar, categorizar e organizar tudo automaticamente.
          </p>
        </div>

        {/* ÁREA DE INPUT E PREVIEW (Split View) */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Lado Esquerdo: Input */}
          <div className='bg-zinc-900/30 border border-zinc-800 rounded-xl p-1'>
            <div className='p-4 border-b border-zinc-800/50 flex justify-between items-center'>
              <span className='text-sm font-medium text-zinc-300 flex items-center gap-2'>
                <FileText className='w-4 h-4' /> Entrada de Dados
              </span>
              <button className='text-xs text-purple-400 hover:text-purple-300'>
                Limpar
              </button>
            </div>
            <textarea
              className='w-full h-80 bg-zinc-950/50 p-4 text-sm text-zinc-300 resize-none outline-none font-mono placeholder:text-zinc-700'
              placeholder={`Cole aqui algo como:
              
12/01 - UBER DO BRASIL - R$ 24,90
PIX ENVIADO JOAO SILVA - 150,00
MC DONALDS - 10/01 - 55,90`}
            />
            <div className='p-4 border-t border-zinc-800/50'>
              <button className='w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20'>
                <Sparkles className='w-4 h-4' />
                Processar com IA
              </button>
            </div>
          </div>

          {/* Lado Direito: Resultado (Simulação) */}
          <div className='bg-zinc-900 border border-zinc-800 rounded-xl p-1 relative overflow-hidden'>
            {/* Background com grid sutil pra dar ar técnico */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

            <div className='p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80 backdrop-blur relative z-10'>
              <span className='text-sm font-medium text-zinc-300 flex items-center gap-2'>
                <Code2 className='w-4 h-4' /> Preview
              </span>
              <div className='flex gap-2'>
                <span className='text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20'>
                  JSON Válido
                </span>
              </div>
            </div>

            <div className='p-4 h-80 overflow-y-auto font-mono text-xs relative z-10 space-y-3'>
              {/* Item Simulado 1 */}
              <div className='bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg border-l-2 border-l-emerald-500'>
                <div className='flex justify-between mb-1'>
                  <span className='text-emerald-400'>"amount": 24.90</span>
                  <span className='text-zinc-500'>Expense</span>
                </div>
                <div className='text-zinc-300'>"category": "Transporte"</div>
                <div className='text-zinc-500'>
                  "description": "Uber Viagem"
                </div>
              </div>

              {/* Item Simulado 2 */}
              <div className='bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg border-l-2 border-l-emerald-500'>
                <div className='flex justify-between mb-1'>
                  <span className='text-emerald-400'>"amount": 55.90</span>
                  <span className='text-zinc-500'>Expense</span>
                </div>
                <div className='text-zinc-300'>"category": "Alimentação"</div>
                <div className='text-zinc-500'>"description": "McDonalds"</div>
              </div>

              {/* Item Simulado 3 */}
              <div className='bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg border-l-2 border-l-rose-500 opacity-60'>
                <div className='flex justify-between mb-1'>
                  <span className='text-rose-400'>Ignorado</span>
                  <span className='text-zinc-500'>Lixo</span>
                </div>
                <div className='text-zinc-500'>
                  "reason": "Dados insuficientes"
                </div>
              </div>
            </div>

            <div className='p-4 border-t border-zinc-800 bg-zinc-900/80 relative z-10'>
              <button className='w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all'>
                <Check className='w-4 h-4' />
                Confirmar e Salvar (2)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
