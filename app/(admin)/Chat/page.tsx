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
import { createTransaction } from '@/app/_actions/transactions'; // Importe sua action de transação

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

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

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
        // Remove o widget da mensagem após confirmar
        setMessages((prev) =>
          prev.map((msg, i) =>
            i === index
              ? {
                  ...msg,
                  action: null,
                  content: `✅ Registrado: ${data.description}`,
                }
              : msg
          )
        );
      }
    } catch (error) {
      alert('Erro ao salvar no banco');
    }
  };

  // FUNÇÃO: CANCELAR/REMOVER WIDGET
  const handleCancel = (index: number) => {
    setMessages((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, action: null } : msg))
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
    <div className='h-screen bg-zinc-950 flex flex-col items-center pt-8 pb-4 px-4'>
      <div className='text-center mb-6'>
        <h2 className='text-xl font-bold text-white'>Assistente Financeiro</h2>
      </div>

      <div
        ref={scrollRef}
        className='flex-1 w-full max-w-2xl overflow-y-auto space-y-6 pr-2 mb-4 scrollbar-hide'
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-4 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'bot'
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-zinc-800'
              }`}
            >
              {msg.role === 'bot' ? (
                <Bot className='w-4 h-4 text-emerald-500' />
              ) : (
                <User className='w-4 h-4 text-zinc-400' />
              )}
            </div>

            <div className='space-y-3 max-w-[80%]'>
              <div
                className={`${
                  msg.role === 'user'
                    ? 'bg-zinc-800'
                    : 'bg-zinc-900/50 border border-zinc-800'
                } rounded-2xl p-4`}
              >
                <p className='text-sm text-zinc-300'>{msg.content}</p>
              </div>

              {msg.action && (
                <div className='bg-zinc-950 border border-zinc-800 rounded-xl p-4 border-l-4 border-l-emerald-500 animate-in slide-in-from-left-2 duration-300'>
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='bg-emerald-500/20 p-2 rounded-lg text-emerald-400'>
                      <Target className='w-5 h-5' />
                    </div>
                    <div>
                      <h4 className='font-bold text-white text-sm'>
                        {msg.action.data.description}
                      </h4>
                      {/* EXIBINDO A CATEGORIA AQUI */}
                      <p className='text-[10px] text-zinc-500 uppercase font-bold tracking-widest'>
                        📂 {msg.action.data.category || 'Geral'}
                      </p>
                    </div>
                  </div>
                  <div className='flex justify-between items-center border-t border-zinc-800 pt-3'>
                    <span className='text-lg font-bold text-emerald-500'>
                      R${' '}
                      {msg.action.data.amount.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <div className='flex gap-2'>
                      {/* BOTÃO CANCELAR */}
                      <button
                        onClick={() => handleCancel(index)}
                        className='p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-500 transition-colors'
                      >
                        <X className='w-4 h-4' />
                      </button>
                      {/* BOTÃO CONFIRMAR */}
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
          <Loader2 className='w-5 h-5 animate-spin text-zinc-600 mx-auto' />
        )}
      </div>

      <div className='w-full max-w-2xl relative'>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          type='text'
          placeholder='Ex: Gastei 50 reais com Uber'
          className='w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-xl pl-4 pr-12 py-4 text-sm text-white outline-none transition-all'
        />
        <button
          onClick={handleSend}
          className='absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors'
        >
          <Send className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
}
