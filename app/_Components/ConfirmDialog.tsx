'use client';

import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className='fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300'>
      <div className='w-full max-w-sm bg-surface border border-border-custom rounded-2xl shadow-2xl relative animate-in zoom-in duration-200'>
        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-zinc-400 hover:text-foreground transition-colors'
        >
          <X className='w-4 h-4' />
        </button>

        <div className='p-6 text-center space-y-4'>
          {/* ÍCONE DE ALERTA */}
          <div
            className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${isDanger ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}
          >
            <AlertTriangle className='w-6 h-6' />
          </div>

          <div className='space-y-2'>
            <h3 className='text-base font-black text-foreground uppercase tracking-tight'>
              {title}
            </h3>
            <p className='text-xs text-zinc-500 font-medium leading-relaxed'>
              {description}
            </p>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className='flex gap-3 pt-2'>
            <button
              onClick={onClose}
              disabled={isLoading}
              className='flex-1 py-3 px-4 bg-background border border-border-custom rounded-xl text-xs font-bold text-zinc-500 hover:text-foreground transition-all active:scale-95 disabled:opacity-50'
            >
              CANCELAR
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 px-4 text-white rounded-xl text-xs font-black tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
              }`}
            >
              {isLoading ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                'CONFIRMAR'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
