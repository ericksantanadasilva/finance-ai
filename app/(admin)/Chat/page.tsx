import React from 'react';
import { Send, Sparkles, Bot, User, Check, X, Target } from 'lucide-react';

export default function AIAgentChat() {
  return (
    <div className='h-screen bg-zinc-950 flex flex-col items-center pt-8 pb-4 px-4 font-sans'>
      {/* Header do Chat */}
      <div className='text-center mb-6'>
        <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium mb-2'>
          <span className='relative flex h-2 w-2'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
            <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
          </span>
          Online
        </div>
        <h2 className='text-xl font-bold text-white'>Assistente Financeiro</h2>
        <p className='text-xs text-zinc-500'>
          Fale naturalmente para criar registros ou metas.
        </p>
      </div>

      {/* ÁREA DE MENSAGENS (Scroll) */}
      <div className='flex-1 w-full max-w-2xl overflow-y-auto space-y-6 pr-2 mb-4 scrollbar-thin scrollbar-thumb-zinc-800'>
        {/* Mensagem IA (Boas vindas) */}
        <div className='flex gap-4'>
          <div className='w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0'>
            <Bot className='w-4 h-4 text-emerald-500' />
          </div>
          <div className='bg-zinc-900/50 border border-zinc-800 rounded-2xl rounded-tl-none p-4 max-w-[80%]'>
            <p className='text-sm text-zinc-300'>
              Olá! Posso ajudar a registrar gastos, criar metas ou analisar suas
              finanças. Tente algo como:
              <span className='block mt-2 text-emerald-400 italic'>
                "Gastei R$ 120,00 no mercado hoje"
              </span>
            </p>
          </div>
        </div>

        {/* Mensagem Usuário */}
        <div className='flex gap-4 flex-row-reverse'>
          <div className='w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0'>
            <User className='w-4 h-4 text-zinc-400' />
          </div>
          <div className='bg-zinc-800 rounded-2xl rounded-tr-none p-4 max-w-[80%]'>
            <p className='text-sm text-white'>
              Quero guardar 2 mil reais pra comprar uma máquina de lavar
            </p>
          </div>
        </div>

        {/* Resposta IA (Action Widget) */}
        <div className='flex gap-4'>
          <div className='w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0'>
            <Sparkles className='w-4 h-4 text-emerald-500' />
          </div>
          <div className='space-y-2 max-w-[80%]'>
            <div className='bg-zinc-900/50 border border-zinc-800 rounded-2xl rounded-tl-none p-4'>
              <p className='text-sm text-zinc-300 mb-3'>
                Ótima iniciativa! Preparei essa meta para você. Posso confirmar?
              </p>

              {/* O WIDGET INTERATIVO DENTRO DO CHAT */}
              <div className='bg-zinc-950 border border-zinc-800 rounded-xl p-4 group hover:border-zinc-700 transition-colors'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='bg-blue-500/20 p-2 rounded-lg text-blue-400'>
                    <Target className='w-5 h-5' />
                  </div>
                  <div>
                    <h4 className='font-bold text-white text-sm'>
                      Máquina de Lavar
                    </h4>
                    <p className='text-xs text-zinc-500'>
                      Nova Meta de Economia
                    </p>
                  </div>
                </div>

                <div className='flex justify-between items-end border-t border-zinc-800 pt-3'>
                  <div>
                    <span className='text-xs text-zinc-500 block'>Alvo</span>
                    <span className='text-lg font-bold text-emerald-500'>
                      R$ 2.000,00
                    </span>
                  </div>
                  <div className='flex gap-2'>
                    <button className='p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 transition-colors'>
                      <X className='w-4 h-4' />
                    </button>
                    <button className='flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all'>
                      <Check className='w-3 h-3' /> Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INPUT AREA */}
      <div className='w-full max-w-2xl relative'>
        <div className='absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-emerald-500/10'>
          <Sparkles className='w-4 h-4 text-emerald-500' />
        </div>
        <input
          type='text'
          placeholder='Digite sua transação ou meta...'
          className='w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-xl pl-12 pr-12 py-4 text-sm text-white outline-none shadow-2xl placeholder:text-zinc-600'
        />
        <button className='absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors'>
          <Send className='w-4 h-4' />
        </button>
      </div>

      <p className='text-[10px] text-zinc-600 mt-3'>
        A IA pode cometer erros. Verifique os valores antes de confirmar.
      </p>
    </div>
  );
}
