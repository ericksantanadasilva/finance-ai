// app/categories/page.tsx
import React from 'react';
import { Plus, Trash2, Edit2, Tag } from 'lucide-react';

export default function CategoriesPage() {
  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-50 font-sans p-8 ml-64'>
      {' '}
      {/* ml-64 compensa a sidebar */}
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-2xl font-bold'>Categorias</h1>
          <p className='text-zinc-400 text-sm'>
            Defina como a IA deve organizar seus gastos.
          </p>
        </div>
        <button className='bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2'>
          <Plus className='w-4 h-4' /> Nova Categoria
        </button>
      </div>
      {/* Grid de Categorias */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {/* Card de Categoria Exemplo 1 */}
        <div className='bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl group hover:border-zinc-700 transition-all flex justify-between items-center'>
          <div className='flex items-center gap-3'>
            <div className='w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'></div>
            <span className='font-medium'>Transporte</span>
          </div>
          <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
            <button className='p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white'>
              <Edit2 className='w-4 h-4' />
            </button>
            <button className='p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-400'>
              <Trash2 className='w-4 h-4' />
            </button>
          </div>
        </div>

        {/* Card de Categoria Exemplo 2 */}
        <div className='bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl group hover:border-zinc-700 transition-all flex justify-between items-center'>
          <div className='flex items-center gap-3'>
            <div className='w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'></div>
            <span className='font-medium'>Alimentação</span>
          </div>
          <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
            <button className='p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white'>
              <Edit2 className='w-4 h-4' />
            </button>
            <button className='p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-400'>
              <Trash2 className='w-4 h-4' />
            </button>
          </div>
        </div>

        {/* Card de Categoria Exemplo 3 (IA Suggestion) */}
        <div className='border border-dashed border-zinc-800 p-4 rounded-xl flex items-center justify-center gap-2 text-zinc-500 cursor-pointer hover:border-zinc-600 hover:text-zinc-300 transition-all hover:bg-zinc-900/20'>
          <Plus className='w-4 h-4' />
          <span className='text-sm'>Criar Personalizada</span>
        </div>
      </div>
      <div className='mt-8 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl flex items-start gap-3'>
        <Tag className='w-5 h-5 text-purple-400 mt-0.5' />
        <div>
          <h4 className='text-sm font-bold text-purple-200'>Dica Pro</h4>
          <p className='text-xs text-purple-300/70 mt-1'>
            Mantenha nomes simples (ex: "Casa", "Lazer"). Isso ajuda a
            Inteligência Artificial a classificar seus extratos com 99% de
            precisão.
          </p>
        </div>
      </div>
    </div>
  );
}
