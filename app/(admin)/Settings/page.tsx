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
import { updateProfile } from '@/app/_actions/settings';
import { toast } from 'sonner';
import { useUser } from '@/app/_Context/UserContext';
import { getAvatarData } from '../../utils/utils';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, refreshUser } = useUser();
  const [mounted, setMounted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [tempName, setTempName] = useState('');

  useEffect(() => {
    setMounted(true);
    if (user) setTempName(user.name);
  }, [user]);

  if (!mounted) return null;

  // Pegamos os dados do avatar dinâmico (Iniciais e Degradê)
  const { initials, theme: avatarTheme } = getAvatarData(
    user?.name || 'Usuário',
  );

  async function handleSave() {
    if (!tempName.trim()) return toast.warning('O nome não pode estar vazio');

    setIsPending(true);
    try {
      const res = await updateProfile({ name: tempName });
      if (res.success) {
        await refreshUser();
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className='min-h-screen bg-background text-foreground font-sans p-4 sm:p-8 transition-all duration-300 lg:ml-64'>
      <div className='max-w-2xl mx-auto lg:mx-0 pt-10 lg:pt-0'>
        <h1 className='text-xl sm:text-2xl font-black mb-2 uppercase tracking-tight'>
          Configurações
        </h1>
        <p className='text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mb-8 font-medium'>
          Gerencie suas preferências e dados da conta com segurança.
        </p>

        {/* SEÇÃO 1: PERFIL */}
        <section className='mb-10 animate-in fade-in slide-in-from-bottom-3'>
          <h2 className='text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2'>
            <User className='w-4 h-4 text-emerald-500' /> Perfil do Usuário
          </h2>

          <div className='bg-surface border border-border-custom rounded-2xl p-6 space-y-8 shadow-sm'>
            <div className='flex flex-col sm:flex-row items-center gap-8'>
              {/* NOVO AVATAR DINÂMICO ESTILIZADO */}
              <div className='flex flex-col items-center gap-2'>
                <div
                  className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${avatarTheme} flex items-center justify-center shadow-2xl rotate-2 transition-transform hover:rotate-0 duration-500`}
                >
                  <span className='text-white font-black text-3xl tracking-tighter'>
                    {initials}
                  </span>
                </div>
                <span className='text-[9px] font-black text-zinc-400 uppercase tracking-tighter'>
                  Avatar Dinâmico
                </span>
              </div>

              <div className='text-center sm:text-left space-y-1'>
                <h3 className='font-black text-foreground text-sm uppercase tracking-tight'>
                  {user?.name || 'Seu Nome'}
                </h3>
                <p className='text-[10px] text-zinc-500 uppercase tracking-widest font-bold'>
                  O avatar é gerado automaticamente com base no seu nome.
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label className='text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em]'>
                  Nome de Exibição
                </label>
                <input
                  type='text'
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className='w-full bg-background border border-border-custom rounded-xl px-4 py-3.5 text-sm font-bold focus:border-emerald-500/50 outline-none transition-all text-foreground shadow-inner'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em]'>
                  Email da Conta
                </label>
                <input
                  type='email'
                  value={user?.email || ''}
                  disabled
                  className='w-full bg-zinc-50 dark:bg-zinc-900/50 border border-border-custom rounded-xl px-4 py-3.5 text-sm opacity-60 cursor-not-allowed font-medium text-zinc-500'
                />
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: APARÊNCIA */}
        <section className='mb-10'>
          <h2 className='text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2'>
            <Smartphone className='w-4 h-4 text-purple-500' /> Estilo do App
          </h2>

          <div className='bg-background/50 border border-border-custom rounded-2xl p-2 grid grid-cols-2 gap-2'>
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl font-bold transition-all border ${
                theme === 'light'
                  ? 'bg-surface text-emerald-600 border-border-custom shadow-md scale-[1.02]'
                  : 'text-zinc-500 border-transparent hover:bg-surface/50'
              }`}
            >
              <Sun className='w-5 h-5' />
              <span className='text-xs uppercase tracking-widest'>
                Modo Claro
              </span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl font-bold transition-all border ${
                theme === 'dark'
                  ? 'bg-zinc-800 text-emerald-400 border-zinc-700 shadow-md scale-[1.02]'
                  : 'text-zinc-500 border-transparent hover:bg-zinc-800/30'
              }`}
            >
              <Moon className='w-5 h-5' />
              <span className='text-xs uppercase tracking-widest'>
                Modo Escuro
              </span>
            </button>
          </div>
        </section>

        {/* SEÇÃO 3: ZONA DE PERIGO */}
        <section className='mb-32'>
          <div className='border border-rose-200 dark:border-rose-900/20 bg-rose-50/50 dark:bg-rose-500/5 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6'>
            <div>
              <h4 className='text-rose-600 dark:text-rose-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 mb-1'>
                <ShieldAlert className='w-4 h-4' /> Excluir Conta
                permanentemente
              </h4>
              <p className='text-zinc-500 text-[11px] font-medium leading-relaxed'>
                Atenção: Todos os seus dados, metas e histórico de transações
                serão apagados sem possibilidade de recuperação.
              </p>
            </div>
            <button className='w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all shadow-lg active:scale-95'>
              EXCLUIR
            </button>
          </div>
        </section>

        {/* BOTÃO SALVAR */}
        <div className='fixed bottom-6 right-6 left-6 sm:relative sm:bottom-0 sm:right-0 sm:left-0 mt-8 flex justify-end'>
          <button
            onClick={handleSave}
            disabled={isPending}
            className='w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl text-xs font-black tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30 active:scale-95 disabled:opacity-50 uppercase'
          >
            {isPending ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : (
              <Save className='w-5 h-5' />
            )}
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
