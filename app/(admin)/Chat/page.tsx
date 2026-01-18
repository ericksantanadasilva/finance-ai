'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Check,
  X,
  Target,
  Loader2,
  Sparkles,
  Menu,
} from 'lucide-react';
import { sendMessage } from '@/app/_actions/chat';
import { createTransaction } from '@/app/_actions/transactions';

export default function AIAgentChat() {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'bot',
      content: 'Olá! Posso ajudar a registrar gastos ou analisar finanças.',
      action: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. MONITOR DE TECLADO E VIEWPORT
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if ((e as any).scale !== 1) e.preventDefault();
    };
    document.addEventListener('touchmove', preventDefault, { passive: false });

    const updateViewport = () => {
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
        window.scrollTo(0, 0);
      }
    };

    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);

    return () => {
      document.removeEventListener('touchmove', preventDefault);
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // FUNÇÃO: CONFIRMAR TRANSAÇÃO
  const handleConfirm = async (index: number, data: any) => {
    try {
      const res = await createTransaction({
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: new Date().toISOString(),
      });

      if (res.success) {
        setMessages((prev) =>
          prev.map((msg, i) =>
            i === index
              ? {
                  ...msg,
                  action: null,
                  content: `✅ Registrado: ${data.description} (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.amount)})`,
                }
              : msg,
          ),
        );
      }
    } catch (error) {
      alert('Erro ao salvar no banco');
    }
  };

  const handleCancel = (index: number) => {
    setMessages((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, action: null } : msg)),
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input;
    setInput('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMsg, action: null },
    ]);
    setIsLoading(true);
    try {
      const response = await sendMessage(userMsg, messages);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: response.reply,
          action: response.action !== 'NONE' ? response : null,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: 'Erro na conexão.', action: null },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className='bg-zinc-950 flex flex-col items-center lg:ml-64 overflow-hidden fixed inset-0 z-[40]'
      style={{
        height: viewportHeight,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
      }}
    >
      {/* HEADER COM BOTÃO DE MENU PARA MOBILE */}
      <div className='w-full flex items-center justify-center py-4 pt-14 lg:pt-8 border-b border-zinc-900 bg-zinc-950 shrink-0 relative'>
        <div className='text-center'>
          <h2 className='text-base font-bold text-white'>
            Assistente Financeiro
          </h2>
          <p className='text-[9px] text-zinc-500 uppercase tracking-widest'>
            Powered by Gemini IA
          </p>
        </div>
      </div>

      {/* MENSAGENS */}
      <div
        ref={scrollRef}
        className='flex-1 w-full max-w-3xl overflow-y-auto p-4 space-y-6 scrollbar-hide overscroll-none'
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'bot' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-zinc-800 border-zinc-700'}`}
            >
              {msg.role === 'bot' ? (
                <Bot className='w-4 h-4 text-emerald-500' />
              ) : (
                <User className='w-4 h-4 text-zinc-400' />
              )}
            </div>
            <div className='space-y-3 max-w-[85%] sm:max-w-[75%]'>
              <div
                className={`${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-none' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-2xl rounded-tl-none'} p-3 text-sm shadow-sm`}
              >
                {msg.content}
              </div>

              {/* WIDGET DE CONFIRMAÇÃO (RESTAURADO) */}
              {msg.action && (
                <div className='bg-zinc-900 border border-zinc-800 rounded-2xl p-4 border-l-4 border-l-emerald-500 animate-in fade-in slide-in-from-bottom-2'>
                  <div className='flex items-center gap-3 mb-4'>
                    <div className='bg-emerald-500/20 p-2 rounded-lg text-emerald-400'>
                      <Target className='w-5 h-5' />
                    </div>
                    <div className='overflow-hidden text-sm'>
                      <h4 className='font-bold text-white truncate'>
                        {msg.action.data.description}
                      </h4>
                      <p className='text-[10px] text-zinc-500 uppercase font-bold tracking-widest truncate'>
                        📂 {msg.action.data.category || 'Geral'}
                      </p>
                    </div>
                  </div>
                  <div className='flex justify-between items-center border-t border-zinc-800 pt-3 gap-2'>
                    <span className='text-base font-bold text-emerald-500'>
                      R${' '}
                      {msg.action.data.amount.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => handleCancel(index)}
                        className='p-2 text-zinc-500 hover:text-rose-500'
                      >
                        <X className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => handleConfirm(index, msg.action.data)}
                        className='bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg text-xs text-white font-medium flex items-center gap-1 transition-all'
                      >
                        <Check className='w-3 h-3' /> Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className='flex gap-3 items-center text-zinc-500 text-xs italic ml-11'>
            <Sparkles className='w-3 h-3' /> Analisando...
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className='w-full max-w-3xl p-4 bg-zinc-950 border-t border-zinc-900 shrink-0 pb-safe'>
        <div className='relative flex items-center mb-2'>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder='Fale com a IA...'
            className='w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-4 pr-12 py-3.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all'
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className='absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all'
          >
            {isLoading ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Send className='w-4 h-4' />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
