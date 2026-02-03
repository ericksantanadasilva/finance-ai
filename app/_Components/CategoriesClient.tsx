'use client';

import { useState } from 'react';
import { Plus, Trash2, Loader2, X } from 'lucide-react';
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
    try {
      await createCategory(name, color);
      setIsOpen(false);
      setName('');
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta categoria?')) {
      await deleteCategory(id);
    }
  };

  return (
    <div className='min-h-screen bg-background text-foreground p-4 sm:p-8 transition-colors duration-300'>
      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-12 lg:pt-0'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold text-foreground'>
            Categorias
          </h1>
          <p className='text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm'>
            Defina como a IA organiza seus gastos.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className='w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20'
        >
          <Plus className='w-4 h-4' /> Nova Categoria
        </button>
      </div>

      {/* GRID DE CATEGORIAS */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {initialCategories.map((cat) => (
          <div
            key={cat.id}
            className='bg-surface border border-border-custom p-4 rounded-xl group hover:border-zinc-400 dark:hover:border-zinc-600 transition-all flex justify-between items-center shadow-sm'
          >
            <div className='flex items-center gap-3 overflow-hidden'>
              <div
                className='w-3 h-3 rounded-full shrink-0'
                style={{
                  backgroundColor: cat.color,
                  boxShadow: `0 0 10px ${cat.color}40`,
                }}
              ></div>
              <span className='font-semibold truncate text-sm sm:text-base text-foreground'>
                {cat.name}
              </span>
            </div>

            <button
              onClick={() => handleDelete(cat.id)}
              className='p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-zinc-400 hover:text-rose-600 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            >
              <Trash2 className='w-4 h-4' />
            </button>
          </div>
        ))}

        {/* BOTÃO ADICIONAR (DASHED) */}
        <button
          onClick={() => setIsOpen(true)}
          className='border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-center gap-2 text-zinc-400 cursor-pointer hover:border-emerald-500/50 hover:text-emerald-600 transition-all hover:bg-zinc-50 dark:hover:bg-emerald-500/5'
        >
          <Plus className='w-4 h-4' />
          <span className='text-sm font-semibold'>Criar Personalizada</span>
        </button>
      </div>

      {/* MODAL */}
      {isOpen && (
        <div className='fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200'>
          <div className='bg-surface border border-border-custom w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl relative'>
            <div className='flex justify-between items-center'>
              <h3 className='text-lg font-bold text-foreground'>
                Nova Categoria
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className='text-zinc-400 hover:text-foreground transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                  Nome da Categoria
                </label>
                <input
                  placeholder='Ex: Lazer, Saúde...'
                  autoComplete='off'
                  className='w-full bg-background border border-border-custom border p-3 rounded-xl outline-none focus:border-emerald-500 transition-all text-foreground placeholder:text-zinc-400'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className='space-y-2'>
                <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                  Cor de Identificação
                </label>
                <div className='flex items-center gap-4 bg-background border border-border-custom border p-3 rounded-xl'>
                  <input
                    type='color'
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className='bg-transparent border-none w-10 h-10 cursor-pointer rounded-lg'
                  />
                  <span className='text-sm text-zinc-500 font-mono font-bold uppercase'>
                    {color}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading || !name}
              className='w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition-all shadow-lg'
            >
              {loading ? (
                <Loader2 className='animate-spin w-5 h-5' />
              ) : (
                'SALVAR CATEGORIA'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
