'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { logout } from '@/app/auth/actions';
import { getUserProfile } from '@/app/_actions/settings'; // Importamos a action que busca no Prisma

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // BUSCA DADOS DO PRISMA (TABELA PÚBLICA)
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getUserProfile();
      if (profile) setUser(profile);
    };
    loadProfile();
  }, [pathname]); // Recarrega ao mudar de página para garantir sincronia

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = () => {
    if (!user?.name) return '??';
    return user.name.substring(0, 2).toUpperCase();
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
      {/* BOTÃO HAMBÚRGUER (MOBILE) */}
      <button
        onClick={() => setIsOpen(true)}
        className='lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-surface border border-border-custom rounded-xl text-foreground shadow-lg'
      >
        <Menu className='w-5 h-5' />
      </button>

      {/* OVERLAY */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300'
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 w-64
          bg-surface border-r border-border-custom
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* LOGO */}
        <div className='h-16 flex items-center justify-between px-6 border-b border-border-custom'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-600/20'>
              <span className='font-black text-white text-lg'>F</span>
            </div>
            <span className='font-bold text-foreground text-lg tracking-tight'>
              Finance.ai
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className='lg:hidden text-zinc-400 p-1'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* NAVEGAÇÃO */}
        <nav className='flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar'>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all border ${
                  isActive
                    ? 'bg-background text-emerald-600 dark:text-emerald-500 border-border-custom shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-foreground hover:bg-background border-transparent'
                } ${item.isSpecial && !isActive ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10' : ''}`}
              >
                <item.icon
                  className={`w-4 h-4 ${isActive && !item.isSpecial ? 'text-emerald-600 dark:text-emerald-500' : item.isSpecial ? 'text-purple-600 dark:text-purple-400' : ''}`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER & PERFIL */}
        <div className='p-4 border-t border-border-custom space-y-1 bg-surface'>
          <Link
            href='/Settings'
            className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-foreground hover:bg-background transition-all'
          >
            <Settings className='w-4 h-4' />
            Configurações
          </Link>

          <button
            onClick={handleLogout}
            className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-all'
          >
            <LogOut className='w-4 h-4' />
            Sair
          </button>

          {/* ÁREA DE PERFIL DINÂMICA */}
          <div className='mt-4 flex items-center gap-3 px-3 py-3 bg-background rounded-xl border border-border-custom shadow-sm'>
            {user?.image ? (
              /* IMAGEM DE PERFIL REAL */
              <img
                src={user.image}
                alt={user.name}
                className='w-8 h-8 rounded-full object-cover border border-border-custom'
              />
            ) : (
              /* PLACEHOLDER COM INICIAIS */
              <div className='w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px] font-black text-emerald-600 dark:text-emerald-500 shrink-0'>
                {getInitials()}
              </div>
            )}

            <div className='flex-1 min-w-0'>
              <p className='text-xs font-black text-foreground truncate'>
                {user?.name || 'Carregando...'}
              </p>
              <p className='text-[9px] font-medium text-zinc-500 truncate'>
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
