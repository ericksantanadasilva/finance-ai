'use client';

import { useState } from 'react';
import { Plus, Trash2, Loader2, X, Tags } from 'lucide-react';
import { createCategory, deleteCategory } from '../_actions/categories';
import ConfirmDialog from '@/app/_Components/ConfirmDialog'; // Importando nosso dialog
import { toast } from 'sonner';

export default function CategoriesClient({
  initialCategories,
}: {
  initialCategories: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [loading, setLoading] = useState(false);

  // ESTADOS PARA EXCLUSÃO
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async () => {
    if (!name) return;
    setLoading(true);
    try {
      await createCategory(name, color);
      toast.success(`Categoria "${name}" criada!`);
      setIsOpen(false);
      setName('');
    } catch (error) {
      toast.error('Erro ao criar categoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await deleteCategory(categoryToDelete);
      toast.success('Categoria removida com sucesso');
    } catch (error) {
      toast.error('Erro ao remover categoria');
    } finally {
      setIsDeleting(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className='min-h-screen bg-background text-foreground p-4 sm:p-8 transition-colors duration-300'>
      {/* DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title='Excluir Categoria'
        description='Tem certeza? Transações já registradas com esta categoria podem ficar sem classificação.'
      />

      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-12 lg:pt-0'>
        <div>
          <h1 className='text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight'>
            Categorias
          </h1>
          <p className='text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium'>
            Gerencie como a Inteligência Artificial organiza seus gastos.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className='w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-xs font-black tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95'
        >
          <Plus className='w-4 h-4' /> NOVA CATEGORIA
        </button>
      </div>

      {/* GRID DE CATEGORIAS */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {initialCategories.map((cat) => (
          <div
            key={cat.id}
            className='bg-surface border border-border-custom p-5 rounded-2xl group hover:border-emerald-500/50 transition-all flex justify-between items-center shadow-sm hover:shadow-md'
          >
            <div className='flex items-center gap-3 overflow-hidden'>
              <div
                className='w-4 h-4 rounded-full shrink-0 border-2 border-white dark:border-zinc-800'
                style={{
                  backgroundColor: cat.color,
                  boxShadow: `0 0 15px ${cat.color}60`,
                }}
              ></div>
              <span className='font-bold truncate text-sm text-foreground uppercase tracking-tight'>
                {cat.name}
              </span>
            </div>

            <button
              onClick={() => setCategoryToDelete(cat.id)}
              className='p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-zinc-400 hover:text-rose-600 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            >
              <Trash2 className='w-4 h-4' />
            </button>
          </div>
        ))}

        {/* BOTÃO ADICIONAR (DASHED) */}
        <button
          onClick={() => setIsOpen(true)}
          className='border-2 border-dashed border-zinc-200 dark:border-border-custom p-5 rounded-2xl flex items-center justify-center gap-2 text-zinc-400 cursor-pointer hover:border-emerald-500/50 hover:text-emerald-600 transition-all hover:bg-zinc-50 dark:hover:bg-emerald-500/5 group'
        >
          <Plus className='w-4 h-4 group-hover:scale-125 transition-transform' />
          <span className='text-xs font-black uppercase tracking-widest'>
            Criar Personalizada
          </span>
        </button>
      </div>

      {/* MODAL DE CRIAÇÃO */}
      {isOpen && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300'>
          <div className='bg-surface border border-border-custom w-full max-w-md rounded-2xl p-8 space-y-8 shadow-2xl relative animate-in zoom-in duration-200'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-2'>
                <Tags className='w-5 h-5 text-emerald-500' />
                <h3 className='text-lg font-black text-foreground uppercase tracking-tight'>
                  Nova Categoria
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className='text-zinc-400 hover:text-foreground transition-colors p-1'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='space-y-6'>
              <div className='space-y-2'>
                <label className='text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]'>
                  Nome da Categoria
                </label>
                <input
                  placeholder='Ex: ALIMENTAÇÃO, SAÚDE...'
                  autoComplete='off'
                  className='w-full bg-background border border-border-custom p-4 rounded-xl outline-none focus:border-emerald-500/50 transition-all text-foreground font-bold placeholder:text-zinc-400 placeholder:font-medium shadow-inner'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className='space-y-2'>
                <label className='text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]'>
                  Cor de Identificação
                </label>
                <div className='flex items-center gap-4 bg-background border border-border-custom p-3 rounded-xl shadow-inner'>
                  <div className='relative w-10 h-10 shrink-0'>
                    <input
                      type='color'
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className='absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10'
                    />
                    <div
                      className='w-full h-full rounded-lg border-2 border-white dark:border-zinc-700 shadow-sm'
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  <span className='text-sm text-zinc-500 font-black tracking-widest uppercase'>
                    {color}
                  </span>
                </div>
              </div>
            </div>

            <div className='flex gap-3 pt-2'>
              <button
                onClick={() => setIsOpen(false)}
                className='flex-1 py-4 bg-background border border-border-custom rounded-xl font-bold text-xs text-zinc-500 hover:text-foreground transition-all uppercase tracking-widest'
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !name}
                className='flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-4 rounded-xl font-black text-white text-xs tracking-[0.2em] flex justify-center items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95'
              >
                {loading ? (
                  <Loader2 className='animate-spin w-5 h-5' />
                ) : (
                  'SALVAR'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
