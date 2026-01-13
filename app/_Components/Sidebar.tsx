'use client'; // Necessário para usar usePathname

import React from 'react';
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

export default function Sidebar() {
  const pathname = usePathname();

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
      {/* Logo Area */}
      <div className='h-16 flex items-center px-6 border-b border-zinc-800'>
        <div className='w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3'>
          <span className='font-bold text-zinc-950 text-xl'>F</span>
        </div>
        <span className='font-bold text-white text-lg tracking-tight'>
          Finance.ai
        </span>
      </div>

      {/* Navigation Links */}
      <nav className='flex-1 px-4 py-6 space-y-1'>
        {menuItems.map((item) => {
          // Verifica se a rota atual é a do item
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

      {/* Bottom Actions (Profile & Settings) */}
      <div className='p-4 border-t border-zinc-800 space-y-1'>
        <Link
          href='/Settings'
          className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all'
        >
          <Settings className='w-4 h-4' />
          Configurações
        </Link>

        <button className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all'>
          <LogOut className='w-4 h-4' />
          Sair
        </button>

        {/* Mini Profile Summary */}
        <div className='mt-4 flex items-center gap-3 px-3 py-3 bg-zinc-900/50 rounded-xl border border-zinc-800'>
          <div className='w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white'>
            VC
          </div>
          <div className='flex-1 overflow-hidden'>
            <p className='text-sm font-medium text-white truncate'>Você</p>
            <p className='text-xs text-zinc-500 truncate'>Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
