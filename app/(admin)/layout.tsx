// app/(admin)/layout.tsx
import React from 'react';
import Sidebar from '../_Components/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* ADICIONAMOS: 
      1. text-foreground para garantir que o texto siga o tema.
      2. overscroll-none para evitar aquele "fundo preto" que aparece ao scrollar no mobile.
    */
    <div className='min-h-screen bg-background text-foreground flex flex-col lg:flex-row transition-colors duration-300 overflow-x-hidden'>
      {/* 1. Sidebar */}
      <Sidebar />

      {/* 2. O Main
        ADICIONAMOS:
        - bg-background aqui também para garantir que não haja transparência revelando o fundo do body.
        - w-full para evitar que o layout quebre em telas menores.
      */}
      <main className='flex-1 w-full min-h-screen bg-background lg:ml-64 transition-all duration-300'>
        {children}
      </main>
    </div>
  );
}
