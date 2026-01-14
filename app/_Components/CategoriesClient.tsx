'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Tag, Loader2, X } from 'lucide-react';
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
    <>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-2xl font-bold'>Categorias</h1>
          <p className='text-zinc-400 text-sm'>
            Defina como a IA organiza seus gastos.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className='bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2'
        >
          <Plus className='w-4 h-4' /> Nova Categoria
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {initialCategories.map((cat) => (
          <div
            key={cat.id}
            className='bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl group hover:border-zinc-700 transition-all flex justify-between items-center'
          >
            <div className='flex items-center gap-3'>
              <div
                className='w-3 h-3 rounded-full'
                style={{
                  backgroundColor: cat.color,
                  boxShadow: `0 0 10px ${cat.color}80`,
                }}
              ></div>
              <span className='font-medium'>{cat.name}</span>
            </div>
            <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
              <button
                onClick={() => handleDelete(cat.id)}
                className='p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-400'
              >
                <Trash2 className='w-4 h-4' />
              </button>
            </div>
          </div>
        ))}

        <div
          onClick={() => setIsOpen(true)}
          className='border border-dashed border-zinc-800 p-4 rounded-xl flex items-center justify-center gap-2 text-zinc-500 cursor-pointer hover:border-zinc-600 hover:text-zinc-300 transition-all hover:bg-zinc-900/20'
        >
          <Plus className='w-4 h-4' />
          <span className='text-sm'>Criar Personalizada</span>
        </div>
      </div>

      {/* MODAL SIMPLES */}
      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
          <div className='bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 space-y-4'>
            <div className='flex justify-between items-center'>
              <h3 className='text-lg font-bold'>Nova Categoria</h3>
              <button onClick={() => setIsOpen(false)}>
                <X className='w-5 h-5' />
              </button>
            </div>
            <input
              placeholder='Nome da categoria (ex: Lazer)'
              className='w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg outline-none focus:border-emerald-500'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className='flex items-center gap-4 italic text-sm text-zinc-400'>
              Escolha uma cor:
              <input
                type='color'
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className='bg-transparent border-none w-8 h-8 cursor-pointer'
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={loading}
              className='w-full bg-emerald-600 py-3 rounded-lg font-bold flex justify-center items-center'
            >
              {loading ? (
                <Loader2 className='animate-spin' />
              ) : (
                'Salvar Categoria'
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
