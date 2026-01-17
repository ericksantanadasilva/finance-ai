// app/settings/page.tsx
import React from 'react';
import { User, Moon, Sun, Smartphone, ShieldAlert, Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-50 font-sans p-8'>
      <div className='max-w-2xl'>
        <h1 className='text-2xl font-bold mb-2'>Configurações</h1>
        <p className='text-zinc-400 text-sm mb-8'>
          Gerencie suas preferências e dados da conta.
        </p>

        {/* SEÇÃO 1: PERFIL PÚBLICO */}
        <section className='mb-10'>
          <h2 className='text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2'>
            <User className='w-4 h-4' /> Perfil
          </h2>

          <div className='bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6'>
            {/* Foto de Perfil */}
            <div className='flex items-center gap-6'>
              <div className='w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold border-2 border-zinc-700'>
                VC
              </div>
              <div>
                <button className='bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all border border-zinc-700'>
                  Alterar Foto
                </button>
                <p className='text-xs text-zinc-500 mt-2'>
                  JPG, GIF ou PNG. Max 2MB.
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <label className='text-xs text-zinc-400'>Nome Completo</label>
                <input
                  type='text'
                  defaultValue='Você'
                  className='w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none'
                />
              </div>
              <div className='space-y-1.5'>
                <label className='text-xs text-zinc-400'>Email</label>
                <input
                  type='email'
                  defaultValue='voce@email.com'
                  className='w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none'
                  disabled
                />
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: APARÊNCIA (THEME TOGGLE) */}
        <section className='mb-10'>
          <h2 className='text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2'>
            <Smartphone className='w-4 h-4' /> Aparência
          </h2>

          <div className='bg-zinc-900/50 border border-zinc-800 rounded-xl p-1 grid grid-cols-3 gap-1'>
            {/* Light Mode Option */}
            <button className='flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-zinc-800 transition-all opacity-50 hover:opacity-100'>
              <Sun className='w-6 h-6' />
              <span className='text-xs font-medium'>Claro</span>
            </button>

            {/* Dark Mode Option (Active) */}
            <button className='flex flex-col items-center gap-2 p-4 rounded-lg bg-zinc-800 border border-zinc-700 shadow-sm'>
              <Moon className='w-6 h-6 text-emerald-500' />
              <span className='text-xs font-medium text-white'>Escuro</span>
            </button>

            {/* System Option */}
            <button className='flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-zinc-800 transition-all opacity-50 hover:opacity-100'>
              <Smartphone className='w-6 h-6' />
              <span className='text-xs font-medium'>Sistema</span>
            </button>
          </div>
        </section>

        {/* SEÇÃO 3: ZONA DE PERIGO */}
        <section>
          <h2 className='text-sm font-semibold text-rose-500 uppercase tracking-wider mb-4 flex items-center gap-2'>
            <ShieldAlert className='w-4 h-4' /> Zona de Perigo
          </h2>

          <div className='border border-rose-900/30 bg-rose-950/10 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div>
              <h4 className='text-white font-medium text-sm'>Deletar Conta</h4>
              <p className='text-zinc-500 text-xs mt-1'>
                Todas as suas transações e metas serão apagadas permanentemente.
              </p>
            </div>
            <button className='bg-rose-600/10 hover:bg-rose-600 hover:text-white text-rose-500 border border-rose-600/20 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap'>
              Excluir minha conta
            </button>
          </div>
        </section>

        {/* Botão Salvar Flutuante ou Fixo */}
        <div className='mt-8 flex justify-end'>
          <button className='bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20'>
            <Save className='w-4 h-4' /> Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
