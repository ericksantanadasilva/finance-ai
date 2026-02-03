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

  // AÇÕES (Mantidas conforme lógica original)
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

  const handleConfirmCreateGoal = async (index: number, data: any) => {
    try {
      let rawDate = data.deadline || data.description || '';
      let finalDate: string | undefined = undefined;
      const dateMatch = rawDate.match(
        /(\d{2}\/\d{2}\/\d{4})|(\d{4}-\d{2}-\d{2})/,
      );

      if (dateMatch) {
        const foundDate = dateMatch[0];
        if (foundDate.includes('/')) {
          const [day, month, year] = foundDate.split('/');
          finalDate = `${year}-${month}-${day}T12:00:00`;
        } else {
          finalDate = `${foundDate}T12:00:00`;
        }
      }

      const res = await createGoal({
        name: data.name,
        targetAmount: Number(data.targetAmount),
        currentAmount: 0,
        deadline: finalDate,
      });

      if (res.success) {
        let displayDate = 'não definido';
        if (finalDate) {
          const [datePart] = finalDate.split('T');
          const [year, month, day] = datePart.split('-');
          displayDate = `${day}/${month}/${year}`;
        }
        updateMessageAfterAction(
          index,
          `🎯 Meta "${data.name}" criada com prazo para ${displayDate}!`,
        );
      }
    } catch (error) {
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
      className='bg-background flex flex-col items-center lg:ml-64 overflow-hidden fixed inset-0 z-[40] transition-colors duration-300'
      style={{ height: viewportHeight }}
    >
      {/* HEADER DO CHAT */}
      <div className='w-full flex items-center justify-center py-4 pt-14 lg:pt-8 border-b border-border-custom bg-surface shrink-0 relative shadow-sm'>
        <div className='flex items-center gap-2'>
          <div className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
          <h2 className='text-sm font-black text-foreground uppercase tracking-widest'>
            Assistente Financeiro
          </h2>
        </div>
      </div>

      {/* ÁREA DE MENSAGENS */}
      <div
        ref={scrollRef}
        className='flex-1 w-full max-w-3xl overflow-y-auto p-4 space-y-6 scrollbar-hide custom-scrollbar'
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* AVATAR */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${msg.role === 'bot' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-surface border-border-custom'}`}
            >
              {msg.role === 'bot' ? (
                <Bot className='w-5 h-5 text-emerald-600 dark:text-emerald-500' />
              ) : (
                <User className='w-5 h-5 text-zinc-500 dark:text-zinc-400' />
              )}
            </div>

            {/* CONTEÚDO */}
            <div
              className={`space-y-3 w-full ${msg.role === 'user' ? 'max-w-[80%] flex flex-col items-end' : 'max-w-[85%]'}`}
            >
              <div
                className={`${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-none font-medium' : 'bg-surface border border-border-custom text-foreground rounded-2xl rounded-tl-none font-medium'} p-4 text-sm shadow-sm leading-relaxed`}
              >
                {msg.content}
              </div>

              {/* CARD DE AÇÃO (WIDGET) */}
              {msg.action && (
                <div
                  className={`bg-surface border border-border-custom rounded-2xl p-5 border-l-4 shadow-md transition-all
                  ${msg.action.action === 'UPDATE_GOAL' ? 'border-l-blue-500' : msg.action.action === 'CREATE_GOAL' ? 'border-l-purple-500' : 'border-l-emerald-500'}`}
                >
                  <div className='flex items-center gap-4 mb-5'>
                    <div
                      className={`p-3 rounded-xl 
                      ${msg.action.action === 'UPDATE_GOAL' ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : msg.action.action === 'CREATE_GOAL' ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}
                    >
                      {msg.action.action === 'CREATE_TRANSACTION' ? (
                        <Receipt className='w-6 h-6' />
                      ) : (
                        <Target className='w-6 h-6' />
                      )}
                    </div>
                    <div className='overflow-hidden'>
                      <h4 className='font-black text-foreground text-sm truncate uppercase tracking-tight'>
                        {msg.action.data.description || msg.action.data.name}
                      </h4>
                      <p className='text-[10px] text-zinc-500 font-bold uppercase tracking-widest'>
                        {msg.action.action === 'CREATE_GOAL'
                          ? '✨ Nova Meta'
                          : msg.action.action === 'UPDATE_GOAL'
                            ? '🎯 Meta Existente'
                            : `📂 ${msg.action.data.category || 'Geral'}`}
                      </p>
                    </div>
                  </div>

                  <div className='flex justify-between items-center border-t border-border-custom pt-4 gap-4'>
                    <span
                      className={`text-xl font-black tracking-tight 
                      ${msg.action.action === 'UPDATE_GOAL' ? 'text-blue-600 dark:text-blue-400' : msg.action.action === 'CREATE_GOAL' ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-500'}`}
                    >
                      R${' '}
                      {(
                        msg.action.data.amount || msg.action.data.targetAmount
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => handleCancel(index)}
                        className='p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all'
                      >
                        <X className='w-5 h-5' />
                      </button>
                      <button
                        onClick={() => {
                          if (msg.action.action === 'CREATE_GOAL')
                            handleConfirmCreateGoal(index, msg.action.data);
                          else if (msg.action.action === 'UPDATE_GOAL')
                            handleConfirmGoalUpdate(index, msg.action.data);
                          else handleConfirmTransaction(index, msg.action.data);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs text-white font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95
                          ${msg.action.action === 'CREATE_GOAL' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20' : msg.action.action === 'UPDATE_GOAL' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'}`}
                      >
                        <Check className='w-4 h-4' /> CONFIRMAR
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className='flex gap-3 items-center text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest ml-12 animate-pulse'>
            <Sparkles className='w-3 h-3' /> Analisando suas finanças...
          </div>
        )}
      </div>

      {/* INPUT DE MENSAGEM */}
      <div className='w-full max-w-3xl p-4 bg-transparent pb-safe shrink-0'>
        <div className='relative flex items-center group'>
          {/* O input agora carrega a borda e o fundo, eliminando a "caixa" externa */}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder='Gastei 50 no almoço...'
            autoComplete='off'
            className='w-full bg-surface border border-border-custom rounded-2xl pl-5 pr-14 py-4 text-sm text-foreground outline-none focus:border-emerald-500/50 transition-all shadow-lg dark:shadow-none placeholder:text-zinc-400'
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className='absolute right-2 p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-90 flex items-center justify-center'
          >
            {isLoading ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : (
              <Send className='w-5 h-5' />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
