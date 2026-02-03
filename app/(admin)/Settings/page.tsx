'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Moon,
  Sun,
  Smartphone,
  ShieldAlert,
  Save,
  Loader2,
  Camera,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { updateProfile, updateProfileImage } from '@/app/_actions/settings';
import { toast } from 'sonner';
import { useUser } from '@/app/_Context/UserContext';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, refreshUser } = useUser(); // Consumimos os dados e a função de atualizar
  const [mounted, setMounted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Estado local para edição do input (para não disparar o contexto a cada tecla)
  const [tempName, setTempName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (user) setTempName(user.name);
  }, [user]);

  if (!mounted) return null;

  // LÓGICA DE SALVAR NOME
  async function handleSave() {
    if (!tempName.trim()) return toast.warning('O nome não pode estar vazio');

    setIsPending(true);
    try {
      const res = await updateProfile({ name: tempName });
      if (res.success) {
        await refreshUser(); // ATUALIZA O CONTEXTO GLOBAL (SIDEBAR MUDA NA HORA)
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsPending(false);
    }
  }

  // LÓGICA DE UPLOAD DE IMAGEM
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação básica
    if (file.size > 2 * 1024 * 1024)
      return toast.error('Arquivo muito grande (Máx 2MB)');

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await updateProfileImage(formData);
      if (res.success) {
        await refreshUser(); // FOTO MUDA NA SIDEBAR INSTANTANEAMENTE
        toast.success('Foto de perfil atualizada!');
      }
    } catch (error) {
      toast.error('Erro ao subir imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = () => {
    if (!user?.name) return '??';
    const names = user.name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

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
              {/* AVATAR COM UPLOAD */}
              <div
                className='relative group cursor-pointer'
                onClick={() => fileInputRef.current?.click()}
              >
                <div className='w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center overflow-hidden border-2 border-border-custom shadow-inner transition-all group-hover:border-emerald-500/50'>
                  {isUploading ? (
                    <Loader2 className='w-8 h-8 animate-spin text-emerald-500' />
                  ) : user?.image ? (
                    <img
                      src={user.image}
                      className='w-full h-full object-cover'
                      alt='Perfil'
                    />
                  ) : (
                    <span className='text-2xl font-black text-emerald-600 dark:text-emerald-500'>
                      {getInitials()}
                    </span>
                  )}
                </div>
                {/* Overlay de Câmera */}
                <div className='absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                  <Camera className='w-6 h-6 text-white' />
                </div>
                <input
                  type='file'
                  ref={fileInputRef}
                  className='hidden'
                  accept='image/*'
                  onChange={handleFileChange}
                />
              </div>

              <div className='text-center sm:text-left space-y-1'>
                <h3 className='font-bold text-foreground text-sm uppercase tracking-tight'>
                  Foto de Perfil
                </h3>
                <p className='text-[10px] text-zinc-500 uppercase tracking-widest font-bold'>
                  JPG, GIF ou PNG. Máximo 2MB.
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
                  className='w-full bg-background border border-border-custom rounded-xl px-4 py-3.5 text-sm font-bold focus:border-emerald-500/50 outline-none transition-all text-foreground placeholder:text-zinc-500 shadow-inner'
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

        {/* BOTÃO SALVAR (FIXO NO MOBILE) */}
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
