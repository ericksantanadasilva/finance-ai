'use client';

import React from 'react';

export default function CategoriesSkeleton() {
  return (
    <div className='min-h-screen bg-background p-4 sm:p-8 animate-pulse'>
      {/* HEADER SKELETON */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-12 lg:pt-0'>
        <div className='space-y-3'>
          <div className='h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg' />
          <div className='h-4 w-64 bg-zinc-100 dark:bg-zinc-900 rounded-md' />
        </div>
        <div className='h-12 w-full sm:w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl' />
      </div>

      {/* GRID DE CATEGORIAS SKELETON */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {/* Simulamos 8 cards de categorias */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className='bg-surface border border-border-custom p-5 rounded-2xl flex justify-between items-center'
          >
            <div className='flex items-center gap-3 w-full'>
              {/* Círculo da cor */}
              <div className='w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0' />
              {/* Nome da categoria */}
              <div className='h-4 w-2/3 bg-zinc-100 dark:bg-zinc-900 rounded-md' />
            </div>
            {/* Ícone de lixeira */}
            <div className='w-4 h-4 bg-zinc-100 dark:bg-zinc-900 rounded-md shrink-0' />
          </div>
        ))}

        {/* CARD DASHED SKELETON */}
        <div className='border-2 border-dashed border-zinc-200 dark:border-border-custom p-5 rounded-2xl flex items-center justify-center gap-2'>
          <div className='w-4 h-4 bg-zinc-100 dark:bg-zinc-900 rounded-full' />
          <div className='h-3 w-32 bg-zinc-100 dark:bg-zinc-900 rounded-md' />
        </div>
      </div>
    </div>
  );
}
