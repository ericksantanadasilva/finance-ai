'use client';

import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  MoreHorizontal,
  Search,
  Bell,
  Plus,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import TransactionDialog from '@/app/_Components/TransactionDialog';
import { useState } from 'react';

export default function DashboardDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    // Fundo Escuro Geral (Padrão SaaS Moderno)
    <div className='min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-500/30'>
      <TransactionDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* --- NAVBAR SUPERIOR --- */}
      <header className='border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='bg-emerald-500 p-2 rounded-lg'>
              <Wallet className='w-5 h-5 text-zinc-950' />
            </div>
            <span className='font-bold text-lg tracking-tight'>Finance.ai</span>
          </div>

          <div className='flex items-center gap-4'>
            <button className='p-2 text-zinc-400 hover:text-white transition-colors'>
              <Search className='w-5 h-5' />
            </button>
            <button className='p-2 text-zinc-400 hover:text-white transition-colors relative'>
              <Bell className='w-5 h-5' />
              <span className='absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full'></span>
            </button>
            <div className='w-8 h-8 bg-zinc-800 rounded-full border border-zinc-700 flex items-center justify-center text-xs font-bold'>
              VC
            </div>
          </div>
        </div>
      </header>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8'>
        {/* CABEÇALHO DA PÁGINA */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold text-white'>Visão Geral</h1>
            <p className='text-zinc-400 text-sm'>
              Bem-vindo de volta! Aqui está sua saúde financeira.
            </p>
          </div>
          <div className='flex gap-3'>
            {/* Botão com "Brilho" de IA - O Diferencial de Venda */}
            <button className='flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-white px-4 py-2 rounded-lg text-sm transition-all group'>
              <Sparkles className='w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors' />
              <span>Importar com IA</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className='flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-900/20'
            >
              <Plus className='w-4 h-4' />
              <span>Nova Transação</span>
            </button>
          </div>
        </div>

        {/* --- CARDS DE KPI (Resumo) --- */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {/* Card 1: Saldo */}
          <div className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl relative overflow-hidden group hover:border-zinc-700 transition-all'>
            <div className='absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity'>
              <Wallet className='w-16 h-16 text-emerald-500' />
            </div>
            <p className='text-sm font-medium text-zinc-400 mb-1'>
              Saldo Atual
            </p>
            <h3 className='text-3xl font-bold text-white'>R$ 12.450,00</h3>
            <p className='text-xs text-emerald-400 mt-2 flex items-center gap-1'>
              <span className='bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-500 font-semibold'>
                +12%
              </span>
              em relação ao mês passado
            </p>
          </div>

          {/* Card 2: Entradas */}
          <div className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-all'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-2 bg-zinc-800/50 rounded-lg'>
                <ArrowUpCircle className='w-5 h-5 text-emerald-500' />
              </div>
              <span className='text-zinc-500 text-xs uppercase font-bold'>
                Receitas
              </span>
            </div>
            <h3 className='text-2xl font-bold text-white'>R$ 8.240,00</h3>
            <p className='text-xs text-zinc-500 mt-1'>Este mês</p>
          </div>

          {/* Card 3: Saídas */}
          <div className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-all'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-2 bg-zinc-800/50 rounded-lg'>
                <ArrowDownCircle className='w-5 h-5 text-rose-500' />
              </div>
              <span className='text-zinc-500 text-xs uppercase font-bold'>
                Despesas
              </span>
            </div>
            <h3 className='text-2xl font-bold text-white'>R$ 3.120,50</h3>
            <p className='text-xs text-zinc-500 mt-1'>Este mês</p>
          </div>
        </div>

        {/* --- ÁREA PRINCIPAL: GRÁFICO E TRANSAÇÕES --- */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Coluna da Esquerda: Gráfico (Simulado visualmente) */}
          <div className='lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='font-semibold text-white'>Fluxo de Caixa</h3>
              <select className='bg-zinc-800 border-none text-xs text-zinc-300 rounded p-1 outline-none cursor-pointer'>
                <option>Últimos 6 meses</option>
                <option>Este ano</option>
              </select>
            </div>

            {/* Placeholder do Gráfico (Barras CSS simples para demo) */}
            <div className='h-64 w-full flex items-end justify-between gap-2 px-2'>
              {[40, 65, 35, 80, 55, 90, 45, 70, 60, 75, 50, 85].map(
                (height, i) => (
                  <div
                    key={i}
                    className='w-full bg-zinc-800 rounded-t-sm relative group'
                  >
                    <div
                      style={{ height: `${height}%` }}
                      className='absolute bottom-0 w-full bg-emerald-600/80 hover:bg-emerald-500 transition-all rounded-t-sm'
                    ></div>
                  </div>
                )
              )}
            </div>
            <div className='flex justify-between mt-2 text-xs text-zinc-500 px-2'>
              <span>Jan</span>
              <span>Fev</span>
              <span>Mar</span>
              <span>Abr</span>
              <span>Mai</span>
              <span>Jun</span>
            </div>
          </div>

          {/* Coluna da Direita: Últimas Transações */}
          <div className='bg-zinc-900/50 border border-zinc-800 rounded-xl p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='font-semibold text-white'>Recentes</h3>
              <button className='text-xs text-emerald-500 hover:text-emerald-400'>
                Ver tudo
              </button>
            </div>

            <div className='space-y-4'>
              {/* Item de Transação 1 */}
              <div className='flex items-center justify-between group cursor-pointer'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors'>
                    <CreditCard className='w-4 h-4 text-zinc-400' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-white'>
                      Netflix Assinatura
                    </p>
                    <p className='text-xs text-zinc-500'>Lazer • Hoje, 14:30</p>
                  </div>
                </div>
                <span className='text-sm font-medium text-white'>
                  - R$ 55,90
                </span>
              </div>

              {/* Item de Transação 2 */}
              <div className='flex items-center justify-between group cursor-pointer'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors'>
                    <Wallet className='w-4 h-4 text-emerald-500' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-white'>
                      Projeto Freelance
                    </p>
                    <p className='text-xs text-zinc-500'>Serviços • Ontem</p>
                  </div>
                </div>
                <span className='text-sm font-medium text-emerald-500'>
                  + R$ 2.500,00
                </span>
              </div>

              {/* Item de Transação 3 */}
              <div className='flex items-center justify-between group cursor-pointer'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors'>
                    <CreditCard className='w-4 h-4 text-zinc-400' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-white'>
                      Uber Viagem
                    </p>
                    <p className='text-xs text-zinc-500'>Transporte • 10 Jan</p>
                  </div>
                </div>
                <span className='text-sm font-medium text-white'>
                  - R$ 24,90
                </span>
              </div>

              {/* Item IA (Exemplo de Categoria Automática) */}
              <div className='flex items-center justify-between group cursor-pointer relative'>
                <div className='absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'></div>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors'>
                    <Sparkles className='w-4 h-4 text-purple-400' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-white'>
                      iFood *McDonalds
                    </p>
                    <p className='text-xs text-purple-400/80 flex items-center gap-1'>
                      Categorizado por IA
                    </p>
                  </div>
                </div>
                <span className='text-sm font-medium text-white'>
                  - R$ 89,90
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
