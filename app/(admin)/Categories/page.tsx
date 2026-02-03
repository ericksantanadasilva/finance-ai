import { getCategories } from '@/app/_actions/categories';
import CategoriesClient from '@/app/_Components/CategoriesClient';
import { Tag } from 'lucide-react';

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className='min-h-screen bg-background text-foreground font-sans p-4 sm:p-8 transition-colors duration-300'>
      <CategoriesClient initialCategories={categories} />

      {/* DICA PRO: Ajustada para contraste máximo */}
      <div className='mt-8 p-4 bg-purple-50 dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 rounded-2xl flex items-start gap-3 shadow-sm'>
        <Tag className='w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5' />
        <div>
          <h4 className='text-sm font-bold text-purple-900 dark:text-purple-400'>
            Dica Pro
          </h4>
          <p className='text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium'>
            Mantenha nomes simples. Isso ajuda a Inteligência Artificial a
            classificar seus extratos com precisão.
          </p>
        </div>
      </div>
    </div>
  );
}
