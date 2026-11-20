'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Check,
  CheckCircle2,
  X,
  Target,
  Loader2,
  Sparkles,
  Receipt,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { sendMessage } from '@/app/_actions/chat';
import { createTransaction } from '@/app/_actions/transactions';
import { updateGoalAmount, createGoal } from '@/app/_actions/goals';
import { toast } from 'sonner';
import { currentMonthISO, todayISO } from '@/app/utils/dates';
import CategoryBadge from '@/app/_Components/CategoryBadge';
import TypeIcon from '@/app/_Components/TypeIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  // Campo de mensagem: o foco volta para ele depois de enviar e depois de
  // confirmar/cancelar um cartão de ação (os botões do cartão somem)
  const inputRef = useRef<HTMLInputElement>(null);
  const focusInput = () => inputRef.current?.focus();

  // Acompanha a altura visível (teclado do celular aberto/fechado). O zoom com
  // dois dedos fica liberado: com zoom ativo (scale > 1) a altura visível
  // encolhe, e ajustar a tela nesse momento atrapalharia quem está ampliando.
  useEffect(() => {
    const updateViewport = () => {
      const vv = window.visualViewport;
      if (vv && vv.scale <= 1) {
        setViewportHeight(`${vv.height}px`);
        window.scrollTo(0, 0);
      }
    };
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);
    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  // AÇÃO DE TRANSAÇÃO ATUALIZADA COM SUPORTE A MÊS DE REFERÊNCIA
  const handleConfirmTransaction = async (index: number, data: any) => {
    try {
      // 1. Pega o mês atual como fallback (ex: 2026-02)
      const currentMonth = currentMonthISO();

      // 2. Prioriza o mês que a IA identificou no texto (ex: "em março")
      // Certifique-se que sua Server Action 'sendMessage' retorne 'referenceMonth' no JSON
      const referenceMonthToUse = data.referenceMonth || currentMonth;

      const res = await createTransaction(
        {
          description: data.description,
          amount: data.amount,
          type: data.type,
          category: data.category,
          date: todayISO(),
        },
        referenceMonthToUse,
      );

      if (res.success) {
        const [year, month] = referenceMonthToUse.split('-');
        const monthName = new Date(
          Number(year),
          Number(month) - 1,
        ).toLocaleString('pt-BR', { month: 'long' });

        updateMessageAfterAction(
          index,
          `Registrado para ${monthName}: ${data.description}`,
        );

        if (res.budgetAlert) {
          const a = res.budgetAlert;
          const fmt = (v: number) =>
            v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          toast.warning(
            a.percent >= 100
              ? `Orçamento de ${a.category} estourado: ${fmt(a.spent)} de ${fmt(a.budget)}.`
              : `${a.category}: ${Math.round(a.percent)}% do orçamento usado (${fmt(a.spent)} de ${fmt(a.budget)}).`,
          );
        }
      } else {
        toast.error('Erro ao salvar transação');
      }
    } catch (error) {
      toast.error('Erro ao salvar transação');
    }
  };

  const handleConfirmGoalUpdate = async (index: number, data: any) => {
    try {
      const deposit = Number(data.amount);
      if (isNaN(deposit) || deposit <= 0) return toast.error('Valor inválido');
      const res = await updateGoalAmount(data.goalId, deposit);
      if (res.success) {
        updateMessageAfterAction(
          index,
          `R$ ${deposit.toLocaleString('pt-BR')} somados à meta: ${data.name}!`,
        );
      }
    } catch (error) {
      toast.error('Erro ao atualizar meta');
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
        let deadlineText = 'sem prazo definido';
        if (finalDate) {
          const [datePart] = finalDate.split('T');
          const [year, month, day] = datePart.split('-');
          deadlineText = `com prazo para ${day}/${month}/${year}`;
        }
        updateMessageAfterAction(
          index,
          `Meta "${data.name}" criada ${deadlineText}!`,
        );
      }
    } catch (error) {
      toast.error('Erro ao criar meta');
    }
  };

  // isDone mostra o ícone de concluído no balão (só visual, como isError)
  const updateMessageAfterAction = (index: number, newContent: string) => {
    setMessages((prev) =>
      prev.map((msg, i) =>
        i === index
          ? { ...msg, action: null, content: newContent, isDone: true }
          : msg,
      ),
    );
    focusInput();
  };

  // A resposta da IA costuma falar como se a ação já tivesse sido feita
  // ("registrei seu gasto..."); ao cancelar, o balão passa a dizer o que houve.
  const handleCancel = (index: number) => {
    setMessages((prev) =>
      prev.map((msg, i) => {
        if (i !== index) return msg;
        const label = msg.action?.data?.description || msg.action?.data?.name;
        return {
          ...msg,
          action: null,
          content: label
            ? `Cancelado: "${label}" não foi salvo.`
            : 'Cancelado: nada foi salvo.',
        };
      }),
    );
    focusInput();
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
      // DICA: No seu sendMessage, garanta que você passa a data atual como contexto
      // para que a IA saiba o que é "mês que vem" ou "março".
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
        // isError só muda o visual do balão (o histórico enviado à IA usa
        // apenas role e content)
        { role: 'bot', content: 'Erro na conexão.', action: null, isError: true },
      ]);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };

  return (
    <div
      className='bg-background flex flex-col items-center lg:ml-64 overflow-hidden fixed inset-0 z-40 transition-colors duration-300'
      style={{ height: viewportHeight }}
    >
      {/* HEADER DO CHAT: faixa com o ponto roxo de "assistente ativo" */}
      <div className='w-full flex items-center justify-center py-4 pt-14 lg:pt-8 border-b-2 border-ink bg-band text-band-foreground shrink-0 relative'>
        <div className='flex items-center gap-2'>
          <span
            className='size-2.5 rounded-full border-2 border-ink bg-ai animate-pulse'
            aria-hidden='true'
          />
          <h2 className='text-sm font-bold lowercase'>
            Assistente Financeiro
          </h2>
        </div>
      </div>

      {/* ÁREA DE MENSAGENS */}
      {/* role="log": leitores de tela anunciam as mensagens novas */}
      <div
        ref={scrollRef}
        role='log'
        aria-live='polite'
        aria-label='Conversa com o assistente'
        className='flex-1 w-full max-w-3xl overflow-y-auto p-4 space-y-6 scrollbar-hide custom-scrollbar'
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* AVATAR: assistente é um adesivo roxo; você, um quadrado plano */}
              <div
                aria-hidden='true'
                className={cn(
                  'size-9 rounded-xl flex items-center justify-center shrink-0 border-2',
                  isUser
                    ? 'border-border-custom bg-surface-muted text-muted-foreground'
                    : 'border-ink bg-ai text-ai-foreground shadow-hard-sm',
                )}
              >
                {isUser ? (
                  <User className='w-5 h-5' />
                ) : (
                  <Bot className='w-5 h-5' />
                )}
              </div>

              {/* CONTEÚDO */}
              <div
                className={`min-w-0 space-y-3 w-full ${isUser ? 'max-w-[80%] flex flex-col items-end' : 'max-w-[85%]'}`}
              >
                {/* Balão: assistente = adesivo com borda esquerda roxa;
                    você = plano, fundo neutro. Quebras de linha preservadas. */}
                <div
                  className={cn(
                    'p-4 text-sm font-medium leading-relaxed whitespace-pre-wrap wrap-break-word rounded-2xl border-2',
                    isUser
                      ? 'rounded-tr-md border-border-custom bg-surface-muted text-foreground'
                      : 'rounded-tl-md border-ink border-l-4 bg-surface text-foreground shadow-hard',
                    !isUser && msg.isError && 'border-l-2 [--ink:var(--expense)]',
                    !isUser && !msg.isError && 'border-l-ai',
                  )}
                >
                  {/* Diz quem fala para o leitor de tela (o avatar é só visual) */}
                  <span className='sr-only'>
                    {isUser ? 'Você: ' : 'Assistente: '}
                  </span>
                  {msg.isError && (
                    <AlertTriangle
                      className='inline w-4 h-4 mr-1.5 -mt-0.5 text-expense'
                      aria-hidden='true'
                    />
                  )}
                  {msg.isDone && (
                    <CheckCircle2
                      className='inline w-4 h-4 mr-1.5 -mt-0.5 text-income'
                      aria-hidden='true'
                    />
                  )}
                  {msg.content}
                </div>

                {/* CARD DE AÇÃO (WIDGET) */}
                {msg.action && (
                  <ActionCard
                    action={msg.action}
                    onCancel={() => handleCancel(index)}
                    onConfirm={() => {
                      if (msg.action.action === 'CREATE_GOAL')
                        handleConfirmCreateGoal(index, msg.action.data);
                      else if (msg.action.action === 'UPDATE_GOAL')
                        handleConfirmGoalUpdate(index, msg.action.data);
                      else handleConfirmTransaction(index, msg.action.data);
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* DIGITANDO: mesmo avatar do assistente, balão plano */}
        {isLoading && (
          <div className='flex gap-3 items-center'>
            <div
              aria-hidden='true'
              className='size-9 rounded-xl flex items-center justify-center shrink-0 border-2 border-ink bg-ai text-ai-foreground shadow-hard-sm'
            >
              <Bot className='w-5 h-5' />
            </div>
            <div className='flex items-center gap-2 rounded-2xl rounded-tl-md border-2 border-border-custom bg-surface px-4 py-2.5 text-xs font-medium text-muted-foreground lowercase animate-pulse'>
              <Sparkles className='w-3.5 h-3.5 text-ai' aria-hidden='true' />
              Analisando suas finanças...
            </div>
          </div>
        )}
      </div>

      {/* INPUT DE MENSAGEM */}
      <div className='w-full max-w-3xl p-4 bg-transparent pb-safe shrink-0'>
        <div className='flex items-center gap-2'>
          {/* text-base no mobile: com 16px o iOS não dá zoom ao focar o campo */}
          <Input
            ref={inputRef}
            aria-label='Mensagem para o assistente'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder='Gastei 50 no almoço e pago em março...'
            autoComplete='off'
            className='h-12 flex-1 text-base sm:text-sm'
          />
          <Button
            size='icon'
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            aria-label='Enviar mensagem'
            className='size-12'
          >
            {isLoading ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : (
              <Send className='w-5 h-5' />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Campos que a IA pode devolver no cartão (todos opcionais)
type ChatAction = {
  action: string;
  data: {
    description?: string;
    name?: string;
    category?: string;
    referenceMonth?: string;
    amount?: number;
    targetAmount?: number;
    type?: string;
    deadline?: string; // YYYY-MM-DD (só em CREATE_GOAL)
  };
};

// Cartão de ação sugerido pela IA: adesivo neutro com o tipo, o valor e os
// botões. Receita/despesa usam a seta (TypeIcon) e a cor só como reforço.
function ActionCard({
  action,
  onCancel,
  onConfirm,
}: {
  action: ChatAction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const data = action.data;
  const isTransaction = action.action === 'CREATE_TRANSACTION';
  const amount = Number(data.amount || data.targetAmount || 0);

  return (
    <div className='rounded-2xl border-2 border-ink bg-surface p-5 shadow-hard'>
      <div className='flex items-center gap-4 mb-5'>
        <div
          className='size-11 shrink-0 rounded-xl border-2 border-ink bg-surface-muted flex items-center justify-center'
          aria-hidden='true'
        >
          {isTransaction ? (
            <Receipt className='w-5 h-5' />
          ) : (
            <Target className='w-5 h-5' />
          )}
        </div>
        <div className='min-w-0 space-y-1'>
          <h4 className='font-bold text-foreground text-sm truncate'>
            {data.description || data.name}
          </h4>
          <div className='flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground'>
            {action.action === 'CREATE_GOAL' ? (
              <span className='inline-flex items-center gap-1 lowercase'>
                <Sparkles className='w-3.5 h-3.5' aria-hidden='true' /> Nova
                Meta
              </span>
            ) : action.action === 'UPDATE_GOAL' ? (
              <span className='inline-flex items-center gap-1 lowercase'>
                <Target className='w-3.5 h-3.5' aria-hidden='true' /> Meta
                Existente
              </span>
            ) : (
              <CategoryBadge name={data.category || 'Geral'} />
            )}

            {/* Exibe o mês de competência se detectado pela IA */}
            {data.referenceMonth && (
              <span className='inline-flex items-center gap-1 lowercase'>
                <Calendar className='w-3.5 h-3.5' aria-hidden='true' />
                {new Date(data.referenceMonth + '-02').toLocaleString(
                  'pt-BR',
                  { month: 'short' },
                )}
              </span>
            )}

            {/* Prazo da meta: mostrado antes de confirmar, para conferir a data */}
            {action.action === 'CREATE_GOAL' && (
              <span className='inline-flex items-center gap-1 lowercase'>
                <Calendar className='w-3.5 h-3.5' aria-hidden='true' />
                {data.deadline
                  ? `até ${data.deadline.split('-').reverse().join('/')}`
                  : 'sem prazo'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* flex-wrap: em telas estreitas os botões descem, o valor não quebra */}
      <div className='flex flex-wrap justify-between items-center border-t border-border-custom pt-4 gap-3'>
        <div className='flex items-center gap-2'>
          {isTransaction && <TypeIcon type={data.type ?? 'expense'} />}
          <span
            className={cn(
              'text-xl font-bold tabular-nums tracking-tight whitespace-nowrap',
              isTransaction &&
                (data.type === 'income' ? 'text-income' : 'text-expense'),
            )}
          >
            R${' '}
            {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className='flex gap-2 shrink-0 ml-auto'>
          <Button
            variant='ghost'
            size='icon'
            onClick={onCancel}
            aria-label='Cancelar ação'
            className='text-muted-foreground hover:text-expense'
          >
            <X className='w-5 h-5' />
          </Button>
          <Button onClick={onConfirm}>
            <Check className='w-4 h-4' /> CONFIRMAR
          </Button>
        </div>
      </div>
    </div>
  );
}
