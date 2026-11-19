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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  // Pegamos os dados do avatar dinâmico (Iniciais e Cor)
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
    <div className='min-h-screen bg-background text-foreground font-sans p-4 sm:p-8 transition-all duration-300'>
      <div className='max-w-2xl mx-auto lg:mx-0 pt-10 lg:pt-0'>
        <h1 className='text-xl sm:text-2xl font-bold mb-2'>Configurações</h1>
        <p className='text-muted-foreground text-xs sm:text-sm mb-8 font-medium'>
          Gerencie suas preferências e dados da conta com segurança.
        </p>

        {/* SEÇÃO 1: PERFIL */}
        <section className='mb-10 animate-in fade-in slide-in-from-bottom-3'>
          <h2 className='text-sm font-bold lowercase mb-4 flex items-center gap-2'>
            <User className='w-4 h-4' /> Perfil do Usuário
          </h2>

          <Card>
            <CardContent className='space-y-8'>
              <div className='flex flex-col sm:flex-row items-center gap-8'>
                {/* NOVO AVATAR DINÂMICO ESTILIZADO */}
                <div className='flex flex-col items-center gap-2'>
                  <div
                    className={`w-24 h-24 rounded-3xl ${avatarTheme} border-2 border-ink shadow-hard flex items-center justify-center rotate-2 transition-transform hover:rotate-0 duration-500`}
                  >
                    <span className='font-black text-3xl tracking-tighter'>
                      {initials}
                    </span>
                  </div>
                  <span className='text-xs font-medium lowercase text-muted-foreground'>
                    Avatar Dinâmico
                  </span>
                </div>

                <div className='text-center sm:text-left space-y-1'>
                  <h3 className='font-bold text-foreground text-base'>
                    {user?.name || 'Seu Nome'}
                  </h3>
                  <p className='text-xs text-muted-foreground font-medium'>
                    O avatar é gerado automaticamente com base no seu nome.
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='settings-name'>Nome de Exibição</Label>
                  <Input
                    id='settings-name'
                    type='text'
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                  />
                </div>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='settings-email'>Email da Conta</Label>
                  <Input
                    id='settings-email'
                    type='email'
                    value={user?.email || ''}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SEÇÃO 2: APARÊNCIA */}
        <section className='mb-10'>
          <h2 className='text-sm font-bold lowercase mb-4 flex items-center gap-2'>
            <Smartphone className='w-4 h-4' /> Estilo do App
          </h2>

          <div className='grid grid-cols-2 gap-4'>
            <Button
              size='lg'
              variant={theme === 'light' ? 'primary' : 'default'}
              aria-pressed={theme === 'light'}
              onClick={() => setTheme('light')}
            >
              <Sun className='w-5 h-5' />
              Modo Claro
            </Button>

            <Button
              size='lg'
              variant={theme === 'dark' ? 'primary' : 'default'}
              aria-pressed={theme === 'dark'}
              onClick={() => setTheme('dark')}
            >
              <Moon className='w-5 h-5' />
              Modo Escuro
            </Button>
          </div>
        </section>

        {/* SEÇÃO 3: ZONA DE PERIGO */}
        <section className='mb-32'>
          <Card>
            <CardContent className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6'>
              <div>
                <h4 className='text-expense font-bold text-sm flex items-center gap-2 mb-1'>
                  <ShieldAlert className='w-4 h-4' /> Excluir Conta
                  permanentemente
                </h4>
                <p className='text-muted-foreground text-xs font-medium leading-relaxed'>
                  Atenção: Todos os seus dados, metas e histórico de transações
                  serão apagados sem possibilidade de recuperação.
                </p>
              </div>
              <Button variant='danger' className='w-full sm:w-auto'>
                EXCLUIR
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* BOTÃO SALVAR */}
        <div className='fixed bottom-6 right-6 left-6 sm:relative sm:bottom-0 sm:right-0 sm:left-0 mt-8 flex justify-end'>
          <Button
            variant='primary'
            size='lg'
            onClick={handleSave}
            disabled={isPending}
            className='w-full sm:w-auto'
          >
            {isPending ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : (
              <Save className='w-5 h-5' />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
