// app/(admin)/layout.tsx
import React from 'react';
import Sidebar from '../_Components/Sidebar'; // Supondo que você salvou o componente lá

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-zinc-950'>
      {/* 1. A Sidebar fixa (Não muda nunca) */}
      <Sidebar />

      {/* 2. O Conteúdo das Páginas (Children) */}
      {/* O 'ml-64' AQUI empurra todas as páginas para a direita automaticamente */}
      <main className='ml-64 min-h-screen'>{children}</main>
    </div>
  );
}
