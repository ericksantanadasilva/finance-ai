'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Target,
  MessageSquare,
  Settings,
  LogOut,
  Tags,
  Menu,
  X,
  Repeat,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useUser } from '../_Context/UserContext';
import { getAvatarData } from '../utils/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  // Pegamos os dados do avatar dinâmico baseado no nome do usuário
  const { initials, theme } = getAvatarData(user?.name || 'Usuário');

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Visão Geral',
      id: 'dashboard',
      href: '/Dashboard',
    },
    {
      icon: Wallet,
      label: 'Transações',
      id: 'transactions',
      href: '/Transactions',
    },
    { icon: Tags, label: 'Categorias', id: 'categories', href: '/Categories' },
    { icon: Repeat, label: 'Recorrentes', id: 'recurring', href: '/Recurring' },
    { icon: Target, label: 'Metas', id: 'goals', href: '/Goals' },
    {
      icon: MessageSquare,
      label: 'Assistente IA',
      id: 'chat',
      href: '/Chat',
      isSpecial: true,
    },
  ];

  return (
    <>
      {/* MOBILE TRIGGER */}
      <Button
        size='icon'
        onClick={() => setIsOpen(true)}
        aria-label='Abrir menu'
        aria-expanded={isOpen}
        className='lg:hidden fixed top-4 left-4 z-50'
      >
        <Menu className='w-5 h-5' />
      </Button>

      {/* OVERLAY */}
      {isOpen && (
        <div
          aria-hidden='true'
          className='fixed inset-0 bg-overlay z-40 lg:hidden animate-in fade-in duration-300'
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 w-64
          bg-surface border-r-2 border-ink
          ${isOpen ? 'translate-x-0 shadow-hard' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* LOGO DO APP */}
        <div className='h-16 flex items-center justify-between px-6 border-b border-border-custom'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-highlight text-highlight-foreground border-2 border-ink rounded-lg flex items-center justify-center shadow-hard-sm'>
              <span className='font-black text-lg'>F</span>
            </div>
            <span className='font-display font-bold text-foreground text-lg'>
              Finance.ai
            </span>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setIsOpen(false)}
            aria-label='Fechar menu'
            className='lg:hidden text-muted-foreground'
          >
            <X className='w-5 h-5' />
          </Button>
        </div>

        {/* LINKS DE NAVEGAÇÃO */}
        <nav className='flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar'>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            // Item ativo vira "adesivo" (contorno + sombra); o da IA usa o roxo
            const activeVariant = item.isSpecial ? 'ai' : 'default';
            const idleColor = item.isSpecial
              ? 'text-ai hover:bg-ai/10'
              : 'text-muted-foreground hover:text-foreground';

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  buttonVariants({
                    variant: isActive ? activeVariant : 'ghost',
                  }),
                  'w-full justify-start gap-3 px-3',
                  !isActive && idleColor,
                )}
              >
                <item.icon className='w-4 h-4' />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER DA SIDEBAR */}
        <div className='p-4 border-t border-border-custom space-y-1 bg-surface'>
          <Link
            href='/Settings'
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'w-full justify-start gap-3 px-3 h-10 text-sm text-muted-foreground hover:text-foreground',
            )}
          >
            <Settings className='w-4 h-4' />
            Configurações
          </Link>

          <Button
            variant='ghost'
            size='sm'
            onClick={handleLogout}
            className='w-full justify-start gap-3 px-3 h-10 text-sm text-expense hover:bg-expense/10'
          >
            <LogOut className='w-4 h-4' />
            Sair
          </Button>

          {/* PERFIL COM LOGO DE INICIAIS DINÂMICA */}
          <div className='mt-4 flex items-center gap-3 px-3 py-3 bg-background rounded-xl border-2 border-ink group'>
            {/* AVATAR COM A COR SÓLIDA DO UTILS */}
            <div
              className={`w-9 h-9 rounded-xl ${theme} border-2 border-ink flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
            >
              <span className='font-black text-xs'>{initials}</span>
            </div>

            <div className='flex-1 min-w-0'>
              <p className='text-sm font-bold text-foreground truncate'>
                {user?.name || 'Carregando...'}
              </p>
              <p className='text-xs text-muted-foreground truncate'>
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
