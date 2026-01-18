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
  Receipt,
} from 'lucide-react';
import { sendMessage } from '@/app/_actions/chat';
import { createTransaction } from '@/app/_actions/transactions';
import { updateGoalAmount, createGoal } from '@/app/_actions/goals';

export default function AIAgentChat() {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'bot',
      content:
        'Olá! Posso ajudar a registrar gastos ou gerenciar suas metas financeiras.',
      action: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  // AÇÃO 1: CONFIRMAR TRANSAÇÃO
  const handleConfirmTransaction = async (index: number, data: any) => {
    try {
      const res = await createTransaction({
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: new Date().toISOString(),
      });
      if (res.success) {
        updateMessageAfterAction(
          index,
          `✅ Transação registrada: ${data.description}`,
        );
      }
    } catch (error) {
      alert('Erro ao salvar transação');
    }
  };

  // AÇÃO 2: CONFIRMAR DEPÓSITO EM META
  const handleConfirmGoalUpdate = async (index: number, data: any) => {
    try {
      const deposit = Number(data.amount);
      if (isNaN(deposit) || deposit <= 0) return alert('Valor inválido');
      const res = await updateGoalAmount(data.goalId, deposit);
      if (res.success) {
        updateMessageAfterAction(
          index,
          `🚀 R$ ${deposit.toLocaleString('pt-BR')} somados à meta: ${data.name}!`,
        );
      }
    } catch (error) {
      alert('Erro ao atualizar meta');
    }
  };

  // AÇÃO 3: CONFIRMAR CRIAÇÃO DE NOVA META
  const handleConfirmCreateGoal = async (index: number, data: any) => {
    try {
      // 1. Tenta pegar a data de onde a IA possa ter colocado
      let rawDate = data.deadline || data.description || '';
      let finalDate: string | undefined = undefined;

      // 2. Limpeza e Formatação Manual
      if (typeof rawDate === 'string' && rawDate.length > 0) {
        // Remove textos extras (ex: "Prazo: 17/02" vira "17/02")
        const dateMatch = rawDate.match(
          /(\d{2}\/\d{2}\/\d{4})|(\d{4}-\d{2}-\d{2})/,
        );

        if (dateMatch) {
          const foundDate = dateMatch[0];
          if (foundDate.includes('/')) {
            // Converte DD/MM/YYYY para YYYY-MM-DD
            const [day, month, year] = foundDate.split('/');
            finalDate = `${year}-${month}-${day}T12:00:00`;
          } else {
            finalDate = `${foundDate}T12:00:00`;
          }
        }
      }

      const res = await createGoal({
        name: data.name,
        targetAmount: Number(data.targetAmount),
        currentAmount: 0,
        deadline: finalDate, // Agora vai formatado ou undefined
      });

      if (res.success) {
        // Formata a data de YYYY-MM-DD para DD/MM/YYYY apenas para exibição
        let displayDate = 'não definido';

        if (finalDate) {
          const [datePart] = finalDate.split('T'); // Remove o T12:00:00
          const [year, month, day] = datePart.split('-');
          displayDate = `${day}/${month}/${year}`;
        }

        updateMessageAfterAction(
          index,
          `🎯 Meta "${data.name}" criada com prazo para ${displayDate}!`,
        );
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao criar meta');
    }
  };

  const updateMessageAfterAction = (index: number, newContent: string) => {
    setMessages((prev) =>
      prev.map((msg, i) =>
        i === index ? { ...msg, action: null, content: newContent } : msg,
      ),
    );
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
      style={{ height: viewportHeight }}
    >
      <div className='w-full flex items-center justify-center py-4 pt-14 lg:pt-8 border-b border-zinc-900 bg-zinc-950 shrink-0 relative'>
        <h2 className='text-base font-bold text-white'>
          Assistente Financeiro
        </h2>
      </div>

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

            <div className='space-y-3 max-w-[85%] sm:max-w-[75%]'>
              <div
                className={`${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-none' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-2xl rounded-tl-none'} p-3 text-sm shadow-sm`}
              >
                {msg.content}
              </div>

              {msg.action && (
                <div
                  className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-4 border-l-4 animate-in fade-in slide-in-from-bottom-2 
                  ${
                    msg.action.action === 'UPDATE_GOAL'
                      ? 'border-l-blue-500'
                      : msg.action.action === 'CREATE_GOAL'
                        ? 'border-l-purple-500'
                        : 'border-l-emerald-500'
                  }`}
                >
                  <div className='flex items-center gap-3 mb-4'>
                    <div
                      className={`p-2 rounded-lg 
                      ${
                        msg.action.action === 'UPDATE_GOAL'
                          ? 'bg-blue-500/20 text-blue-400'
                          : msg.action.action === 'CREATE_GOAL'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {msg.action.action === 'CREATE_TRANSACTION' ? (
                        <Receipt className='w-5 h-5' />
                      ) : (
                        <Target className='w-5 h-5' />
                      )}
                    </div>
                    <div className='overflow-hidden text-sm'>
                      <h4 className='font-bold text-white truncate'>
                        {msg.action.data.description || msg.action.data.name}
                      </h4>
                      <p className='text-[10px] text-zinc-500 uppercase font-bold tracking-widest'>
                        {msg.action.action === 'CREATE_GOAL'
                          ? '✨ Nova Meta'
                          : msg.action.action === 'UPDATE_GOAL'
                            ? '🎯 Meta Existente'
                            : `📂 ${msg.action.data.category || 'Geral'}`}
                      </p>
                    </div>
                  </div>

                  <div className='flex justify-between items-center border-t border-zinc-800 pt-3 gap-2'>
                    <span
                      className={`text-base font-bold 
                      ${
                        msg.action.action === 'UPDATE_GOAL'
                          ? 'text-blue-500'
                          : msg.action.action === 'CREATE_GOAL'
                            ? 'text-purple-500'
                            : 'text-emerald-500'
                      }`}
                    >
                      R${' '}
                      {(
                        msg.action.data.amount || msg.action.data.targetAmount
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => handleCancel(index)}
                        className='p-2 text-zinc-500 hover:text-rose-500'
                      >
                        <X className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => {
                          if (msg.action.action === 'CREATE_GOAL')
                            handleConfirmCreateGoal(index, msg.action.data);
                          else if (msg.action.action === 'UPDATE_GOAL')
                            handleConfirmGoalUpdate(index, msg.action.data);
                          else handleConfirmTransaction(index, msg.action.data);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs text-white font-medium flex items-center gap-1 transition-all shadow-lg
                          ${
                            msg.action.action === 'CREATE_GOAL'
                              ? 'bg-purple-600 hover:bg-purple-500'
                              : msg.action.action === 'UPDATE_GOAL'
                                ? 'bg-blue-600 hover:bg-blue-500'
                                : 'bg-emerald-600 hover:bg-emerald-500'
                          }`}
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

      <div className='w-full max-w-3xl p-4 bg-zinc-950 border-t border-zinc-900 pb-safe'>
        <div className='relative flex items-center mb-2'>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder='Gastei 50 no almoço ou Quero economizar 2000 para...'
            className='w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-4 pr-12 py-3.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all'
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className='absolute right-2 p-2 bg-emerald-600 text-white rounded-xl'
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
