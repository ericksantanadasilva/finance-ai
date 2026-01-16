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
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { logout } from '@/app/auth/actions';

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  // Cliente do Supabase para o lado do cliente
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // Pega as iniciais do nome ou email para o avatar
  const getInitials = () => {
    if (!user) return '??';
    const name = user.user_metadata?.full_name || user.email;
    return name.substring(0, 2).toUpperCase();
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
    <aside className='w-64 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col fixed left-0 top-0 z-40'>
      <div className='h-16 flex items-center px-6 border-b border-zinc-800'>
        <div className='w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3'>
          <span className='font-bold text-zinc-950 text-xl'>F</span>
        </div>
        <span className='font-bold text-white text-lg tracking-tight'>
          Finance.ai
        </span>
      </div>

      <nav className='flex-1 px-4 py-6 space-y-1'>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
              } ${
                item.isSpecial && !isActive
                  ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                  : ''
              }`}
            >
              <item.icon
                className={`w-4 h-4 ${
                  item.isSpecial || isActive
                    ? 'text-purple-400'
                    : 'text-zinc-400'
                } ${isActive && !item.isSpecial ? 'text-white' : ''}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className='p-4 border-t border-zinc-800 space-y-1'>
        <Link
          href='/Settings'
          className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all'
        >
          <Settings className='w-4 h-4' />
          Configurações
        </Link>

        <button
          onClick={handleLogout}
          className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all'
        >
          <LogOut className='w-4 h-4' />
          Sair
        </button>

        <div className='mt-4 flex items-center gap-3 px-3 py-3 bg-zinc-900/50 rounded-xl border border-zinc-800'>
          <div className='w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-500'>
            {getInitials()}
          </div>
          <div className='flex-1 overflow-hidden'>
            <p className='text-sm font-medium text-white truncate'>
              {user?.user_metadata?.full_name || 'Usuário'}
            </p>
            <p className='text-[10px] text-zinc-500 truncate'>{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
