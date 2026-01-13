import React from 'react';
import { Target, Plus, Car, Home, Laptop, Plane } from 'lucide-react';

export default function GoalsPage() {
  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-50 font-sans p-8'>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-2xl font-bold'>Metas Financeiras</h1>
          <p className='text-zinc-400 text-sm'>
            Visualize e acompanhe seus sonhos.
          </p>
        </div>
        <button className='bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2'>
          <Plus className='w-4 h-4' /> Nova Meta
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* CARD META 1 (Em andamento) */}
        <div className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-all group relative overflow-hidden'>
          <div className='flex justify-between items-start mb-4'>
            <div className='p-3 bg-blue-500/10 text-blue-500 rounded-lg'>
              <Car className='w-6 h-6' />
            </div>
            <span className='text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800'>
              2024
            </span>
          </div>

          <h3 className='text-lg font-bold text-white mb-1'>Trocar de Carro</h3>
          <p className='text-sm text-zinc-400 mb-6'>
            Economia para entrada do Honda.
          </p>

          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-white font-medium'>R$ 15.000</span>
              <span className='text-zinc-500'>de R$ 45.000</span>
            </div>
            {/* Progress Bar */}
            <div className='h-2 w-full bg-zinc-800 rounded-full overflow-hidden'>
              <div className='h-full bg-blue-500 w-[33%] rounded-full relative'>
                <div className='absolute top-0 right-0 h-full w-2 bg-white/50 animate-pulse'></div>
              </div>
            </div>
            <p className='text-xs text-zinc-500 text-right mt-1'>
              33% concluído
            </p>
          </div>
        </div>

        {/* CARD META 2 (Quase lá) */}
        <div className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-all group'>
          <div className='flex justify-between items-start mb-4'>
            <div className='p-3 bg-emerald-500/10 text-emerald-500 rounded-lg'>
              <Laptop className='w-6 h-6' />
            </div>
            <span className='text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800'>
              Q3
            </span>
          </div>

          <h3 className='text-lg font-bold text-white mb-1'>MacBook Pro</h3>
          <p className='text-sm text-zinc-400 mb-6'>Upgrade para trabalho.</p>

          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-white font-medium'>R$ 11.200</span>
              <span className='text-zinc-500'>de R$ 14.000</span>
            </div>
            <div className='h-2 w-full bg-zinc-800 rounded-full overflow-hidden'>
              <div className='h-full bg-emerald-500 w-[80%] rounded-full'></div>
            </div>
            <p className='text-xs text-zinc-500 text-right mt-1'>
              80% concluído
            </p>
          </div>
        </div>

        {/* CARD META 3 (Início) */}
        <div className='bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-all group'>
          <div className='flex justify-between items-start mb-4'>
            <div className='p-3 bg-purple-500/10 text-purple-500 rounded-lg'>
              <Plane className='w-6 h-6' />
            </div>
            <span className='text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800'>
              2025
            </span>
          </div>

          <h3 className='text-lg font-bold text-white mb-1'>Viagem Japão</h3>
          <p className='text-sm text-zinc-400 mb-6'>
            Férias de 20 dias em Tóquio.
          </p>

          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-white font-medium'>R$ 2.000</span>
              <span className='text-zinc-500'>de R$ 30.000</span>
            </div>
            <div className='h-2 w-full bg-zinc-800 rounded-full overflow-hidden'>
              <div className='h-full bg-purple-500 w-[7%] rounded-full'></div>
            </div>
            <p className='text-xs text-zinc-500 text-right mt-1'>
              7% concluído
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
