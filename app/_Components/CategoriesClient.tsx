'use client';

import { useState } from 'react';
import { Plus, Trash2, Tag, Loader2, X } from 'lucide-react';
import { createCategory, deleteCategory } from '../_actions/categories';

export default function CategoriesClient({
  initialCategories,
}: {
  initialCategories: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name) return;
    setLoading(true);
    await createCategory(name, color);
    setLoading(false);
    setIsOpen(false);
    setName('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta categoria?')) {
      await deleteCategory(id);
    }
  };

  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-50 p-4 sm:p-8 transition-all duration-300'>
      {/* HEADER: Stack no mobile, Row no desktop */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-12 sm:pt-0'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold'>Categorias</h1>
          <p className='text-zinc-400 text-xs sm:text-sm'>
            Defina como a IA organiza seus gastos.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className='w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10'
        >
          <Plus className='w-4 h-4' /> Nova Categoria
        </button>
      </div>

      {/* GRID: Ajustado para colunas dinâmicas conforme a tela */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {initialCategories.map((cat) => (
          <div
            key={cat.id}
            className='bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl group hover:border-zinc-700 transition-all flex justify-between items-center'
          >
            <div className='flex items-center gap-3 overflow-hidden'>
              <div
                className='w-3 h-3 rounded-full shrink-0'
                style={{
                  backgroundColor: cat.color,
                  boxShadow: `0 0 10px ${cat.color}80`,
                }}
              ></div>
              <span className='font-medium truncate text-sm sm:text-base'>
                {cat.name}
              </span>
            </div>

            {/* AÇÕES: Visíveis sempre no mobile, hover no desktop */}
            <div className='flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity'>
              <button
                onClick={() => handleDelete(cat.id)}
                className='p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-rose-400 active:scale-95 transition-all'
              >
                <Trash2 className='w-4 h-4' />
              </button>
            </div>
          </div>
        ))}

        {/* BOTÃO ADICIONAR (ESTILO CARD) */}
        <button
          onClick={() => setIsOpen(true)}
          className='border border-dashed border-zinc-800 p-4 rounded-xl flex items-center justify-center gap-2 text-zinc-500 cursor-pointer hover:border-zinc-600 hover:text-zinc-300 transition-all hover:bg-zinc-900/20 active:scale-[0.98]'
        >
          <Plus className='w-4 h-4' />
          <span className='text-sm'>Criar Personalizada</span>
        </button>
      </div>

      {/* MODAL: Centralizado e responsivo */}
      {isOpen && (
        <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
          <div className='bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 space-y-6 animate-in fade-in zoom-in duration-200'>
            <div className='flex justify-between items-center'>
              <h3 className='text-lg font-bold text-white'>Nova Categoria</h3>
              <button
                onClick={() => setIsOpen(false)}
                className='text-zinc-500 hover:text-white transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <label className='text-xs font-medium text-zinc-400 uppercase tracking-wider'>
                  Nome
                </label>
                <input
                  placeholder='Ex: Lazer, Saúde...'
                  className='w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-emerald-500 transition-all'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className='space-y-2'>
                <label className='text-xs font-medium text-zinc-400 uppercase tracking-wider text-block'>
                  Cor de Identificação
                </label>
                <div className='flex items-center gap-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800'>
                  <input
                    type='color'
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className='bg-transparent border-none w-10 h-10 cursor-pointer rounded-lg overflow-hidden'
                  />
                  <span className='text-sm text-zinc-400 font-mono uppercase'>
                    {color}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading || !name}
              className='w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition-all shadow-lg shadow-emerald-900/20'
            >
              {loading ? (
                <Loader2 className='animate-spin w-5 h-5' />
              ) : (
                'Salvar Categoria'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
