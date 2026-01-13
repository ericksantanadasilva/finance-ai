import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function CategoryDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  // Cores disponíveis para a categoria
  const colors = [
    { name: 'blue', value: 'bg-blue-500' },
    { name: 'emerald', value: 'bg-emerald-500' },
    { name: 'rose', value: 'bg-rose-500' },
    { name: 'amber', value: 'bg-amber-500' },
    { name: 'purple', value: 'bg-purple-500' },
    { name: 'zinc', value: 'bg-zinc-500' },
  ];

  const [selectedColor, setSelectedColor] = useState(colors[0].value);

  return (
    // Overlay (Fundo escuro)
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
      {/* Modal Content */}
      <div className='w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-lg font-bold text-white'>Nova Categoria</h2>
          <button
            onClick={onClose}
            className='text-zinc-500 hover:text-white transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <form className='space-y-6'>
          {/* Nome da Categoria */}
          <div className='space-y-2'>
            <label className='text-xs font-medium text-zinc-400'>Nome</label>
            <input
              type='text'
              placeholder='Ex: Assinaturas, Casa, Lazer...'
              className='w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-600'
            />
          </div>

          {/* Seletor de Cor */}
          <div className='space-y-2'>
            <label className='text-xs font-medium text-zinc-400'>
              Cor da Etiqueta
            </label>
            <div className='flex gap-3'>
              {colors.map((color) => (
                <button
                  type='button'
                  key={color.name}
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded-full ${
                    color.value
                  } flex items-center justify-center transition-transform hover:scale-110 ${
                    selectedColor === color.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950'
                      : 'opacity-70 hover:opacity-100'
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
          <div className='flex gap-3 pt-2'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all'
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-900/20'
            >
              Criar Categoria
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
