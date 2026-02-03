'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function CategoryDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const colors = [
    { name: 'blue', value: 'bg-blue-500' },
    { name: 'emerald', value: 'bg-emerald-500' },
    { name: 'rose', value: 'bg-rose-500' },
    { name: 'amber', value: 'bg-amber-500' },
    { name: 'purple', value: 'bg-purple-500' },
    { name: 'zinc', value: 'bg-zinc-500' },
  ];

  const [selectedColor, setSelectedColor] = useState(colors[0].value);

  if (!isOpen) return null;

  return (
    // Overlay adaptativo
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
      {/* Modal Content - Usando bg-surface e border-custom */}
      <div className='w-full max-w-md bg-surface border border-border-custom rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-lg font-bold text-foreground'>Nova Categoria</h2>
          <button
            onClick={onClose}
            className='text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <form className='space-y-6' onSubmit={(e) => e.preventDefault()}>
          {/* Nome da Categoria */}
          <div className='space-y-2'>
            <label className='text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest'>
              Nome da Categoria
            </label>
            <input
              type='text'
              placeholder='Ex: Assinaturas, Casa, Lazer...'
              className='w-full bg-background border border-border-custom rounded-xl px-4 py-3 text-sm text-foreground focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-500 shadow-sm'
            />
          </div>

          {/* Seletor de Cor */}
          <div className='space-y-2'>
            <label className='text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest'>
              Cor da Etiqueta
            </label>
            <div className='flex flex-wrap gap-3'>
              {colors.map((color) => (
                <button
                  type='button'
                  key={color.name}
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-9 h-9 rounded-full ${color.value} flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm ${
                    selectedColor === color.value
                      ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-white dark:ring-offset-zinc-950 ring-offset-white'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {selectedColor === color.value && (
                    <Check className='w-4 h-4 text-white' />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-900 border border-border-custom rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all'
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20'
            >
              CRIAR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
