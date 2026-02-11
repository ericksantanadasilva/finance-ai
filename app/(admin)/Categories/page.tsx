import { Suspense } from 'react';
import { getCategories } from '@/app/_actions/categories';
import CategoriesClient from '@/app/_Components/CategoriesClient';
import CategoriesSkeleton from '@/app/_Components/categoriesSkeleton';
import { Tag } from 'lucide-react';

// Componente interno para buscar os dados
async function CategoriesList() {
  const categories = await getCategories();
  return <CategoriesClient initialCategories={categories} />;
}

export default function CategoriesPage() {
  return (
    <div className='min-h-screen bg-background text-foreground font-sans p-4 sm:p-8 transition-colors duration-300'>
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesList />
      </Suspense>

      {/* DICA PRO - Renderiza imediatamente pois não depende de dados */}
      <div className='mt-8 p-4 bg-purple-50 dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 rounded-2xl flex items-start gap-3 shadow-sm'>
        <Tag className='w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5' />
        <div>
          <h4 className='text-sm font-bold text-purple-900 dark:text-purple-400 uppercase tracking-tight'>
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
