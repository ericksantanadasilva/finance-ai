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
  const scrollRef = useRef<HTMLDivElement>(null);

  // FUNÇÃO DE SCROLL: Agora com um pequeno timeout para esperar o teclado abrir
  const scrollToBottom = () => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
                  content: `✅ Registrado: ${data.description}`,
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
    const userMessage = input;
    setInput('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, action: null },
    ]);
    setIsLoading(true);

    try {
      const response = await sendMessage(userMessage, messages);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: response.reply,
          action: response.action !== 'NONE' ? response : null,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: 'Erro na conexão.', action: null },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /**
     * MUDANÇA CHAVE:
     * 1. h-[100svh] garante que o container sempre respeite a altura visível, mesmo com teclado.
     * 2. overflow-hidden no pai evita que o body inteiro role, focando o scroll apenas na lista.
     */
    <div className='h-[100svh] bg-zinc-950 flex flex-col items-center lg:ml-64 transition-all duration-300 overflow-hidden'>
      {/* HEADER FIXO */}
      <div className='w-full text-center py-4 pt-14 lg:pt-6 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md shrink-0'>
        <h2 className='text-base sm:text-lg font-bold text-white'>
          Assistente Financeiro
        </h2>
        <p className='text-[9px] text-zinc-500 uppercase tracking-widest'>
          Powered by Gemini IA
        </p>
      </div>

      {/* ÁREA DE MENSAGENS: flex-1 permite que ela encolha quando o teclado sobe */}
      <div
        ref={scrollRef}
        className='flex-1 w-full max-w-3xl overflow-y-auto p-4 space-y-6 scrollbar-hide'
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
            <div className={`space-y-3 max-w-[85%] sm:max-w-[75%]`}>
              <div
                className={`${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-none' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-2xl rounded-tl-none'} p-3 shadow-sm`}
              >
                <p className='text-sm leading-relaxed'>{msg.content}</p>
              </div>
              {msg.action && (
                <div className='bg-zinc-900 border border-zinc-800 rounded-2xl p-4 border-l-4 border-l-emerald-500'>
                  <div className='flex items-center gap-3 mb-4'>
                    <div className='bg-emerald-500/20 p-2 rounded-lg text-emerald-400'>
                      <Target className='w-5 h-5' />
                    </div>
                    <div className='overflow-hidden'>
                      <h4 className='font-bold text-white text-sm truncate'>
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
                        className='p-2 text-zinc-500'
                      >
                        <X className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => handleConfirm(index, msg.action.data)}
                        className='bg-emerald-600 px-3 py-1.5 rounded-lg text-xs text-white font-medium'
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className='flex gap-3 items-center text-zinc-500 text-xs italic ml-11 animate-pulse'>
            <Sparkles className='w-3 h-3' /> Analisando...
          </div>
        )}
      </div>

      {/* INPUT AREA: Agora sem o 'sticky' mas com 'shrink-0' para ficar sempre na base do container flex */}
      <div className='w-full max-w-3xl p-4 bg-zinc-950 border-t border-zinc-900 shrink-0'>
        <div className='relative flex items-center'>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={scrollToBottom} // Garante o scroll quando o teclado sobe
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            type='text'
            placeholder='Fale com a IA...'
            className='w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-2xl pl-4 pr-12 py-3.5 text-sm text-white outline-none transition-all'
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className='absolute right-2 p-2 bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl'
          >
            {isLoading ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Send className='w-4 h-4' />
            )}
          </button>
        </div>
        <p className='text-[8px] text-center text-zinc-600 mt-2 uppercase'>
          Revise os valores antes de confirmar.
        </p>
      </div>
    </div>
  );
}
