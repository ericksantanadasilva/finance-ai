'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Moon,
  Sun,
  Smartphone,
  ShieldAlert,
  Save,
  Loader2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { updateProfile, getUserProfile } from '@/app/_actions/settings';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      const profile = await getUserProfile();
      if (profile) {
        setName(profile.name);
        setEmail(profile.email || '');
      }
    }
    loadData();
  }, []);

  // Evita erro de hidratação (comum ao usar next-themes)
  if (!mounted) return null;

  async function handleSave() {
    if (!name.trim()) return toast.warning('O nome não pode estar vazio');

    setIsPending(true);
    try {
      const res = await updateProfile({ name });
      if (res.success) toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className='min-h-screen bg-background text-foreground font-sans p-4 sm:p-8 transition-all duration-300 lg:ml-64'>
      <div className='max-w-2xl mx-auto lg:mx-0 pt-10 lg:pt-0'>
        <h1 className='text-xl sm:text-2xl font-bold mb-2'>Configurações</h1>
        <p className='text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mb-8'>
          Gerencie suas preferências e dados da conta.
        </p>

        {/* SEÇÃO 1: PERFIL */}
        <section className='mb-10 animate-in fade-in slide-in-from-bottom-3'>
          <h2 className='text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2'>
            <User className='w-3.5 h-3.5' /> Perfil
          </h2>

          <div className='bg-surface border border-border-custom rounded-2xl p-6 space-y-6 shadow-sm dark:shadow-none'>
            <div className='flex flex-col sm:flex-row items-center gap-6'>
              <div className='w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-2xl font-bold border-2 border-emerald-500/20 text-emerald-600 dark:text-emerald-500 shadow-inner'>
                {name ? name.substring(0, 2).toUpperCase() : '??'}
              </div>
              <div className='text-center sm:text-left'>
                <button className='bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground px-4 py-2 rounded-xl text-xs font-bold transition-all border border-border-custom shadow-sm'>
                  Alterar Foto
                </button>
                <p className='text-[10px] text-zinc-500 mt-2 uppercase tracking-tighter font-medium'>
                  JPG, GIF ou PNG. Max 2MB.
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <label className='text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest'>
                  Nome Completo
                </label>
                <input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Nome do usuário'
                  className='w-full bg-background border border-border-custom rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all text-foreground'
                />
              </div>
              <div className='space-y-1.5'>
                <label className='text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest'>
                  Email da Conta
                </label>
                <input
                  type='email'
                  value={email}
                  disabled
                  className='w-full bg-zinc-100 dark:bg-zinc-900 border border-border-custom rounded-xl px-4 py-3 text-sm opacity-60 cursor-not-allowed italic text-zinc-500'
                />
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: APARÊNCIA (O CONTROLE DE TEMAS) */}
        <section className='mb-10'>
          <h2 className='text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2'>
            <Smartphone className='w-3.5 h-3.5' /> Aparência
          </h2>

          {/* Container agora usa bg-surface ou uma cor neutra que mude */}
          <div className='bg-zinc-200/50 dark:bg-zinc-900 border border-border-custom rounded-2xl p-1.5 grid grid-cols-2 gap-1.5'>
            {/* BOTAO LIGHT */}
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                theme === 'light'
                  ? 'bg-white text-emerald-600 shadow-md ring-1 ring-black/5'
                  : 'text-zinc-500 hover:bg-white/50 dark:hover:bg-zinc-800'
              }`}
            >
              <Sun className='w-5 h-5' />
              <span className='text-[10px] font-bold uppercase'>Claro</span>
            </button>

            {/* BOTAO DARK */}
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'bg-zinc-800 text-emerald-500 shadow-md ring-1 ring-white/10'
                  : 'text-zinc-500 hover:bg-white/50 dark:hover:bg-zinc-800'
              }`}
            >
              <Moon className='w-5 h-5' />
              <span className='text-[10px] font-bold uppercase'>Escuro</span>
            </button>
          </div>
        </section>

        {/* SEÇÃO 3: ZONA DE PERIGO */}
        <section className='mb-24'>
          <div className='border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-500/5 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div>
              <h4 className='text-rose-600 dark:text-rose-500 font-bold text-sm flex items-center gap-2'>
                <ShieldAlert className='w-4 h-4' /> Deletar Conta
              </h4>
              <p className='text-zinc-500 text-xs mt-1 font-medium'>
                Esta ação é irreversível. Todas as transações serão apagadas.
              </p>
            </div>
            <button className='w-full sm:w-auto bg-rose-600 hover:bg-rose-700 dark:bg-rose-600/10 dark:hover:bg-rose-600 text-white dark:text-rose-600 dark:hover:text-white border border-rose-600/20 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm'>
              Excluir Conta
            </button>
          </div>
        </section>

        {/* BOTÃO SALVAR (FIXO NO MOBILE) */}
        <div className='fixed bottom-6 right-6 left-6 sm:relative sm:bottom-0 sm:right-0 sm:left-0 mt-8 flex justify-end'>
          <button
            onClick={handleSave}
            disabled={isPending}
            className='w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl text-sm font-black tracking-widest transition-all flex items-center justify-center gap-2 shadow-2xl shadow-emerald-500/30 active:scale-95'
          >
            {isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Save className='w-4 h-4' />
            )}
            SALVAR ALTERAÇÕES
          </button>
        </div>
      </div>
    </div>
  );
}
