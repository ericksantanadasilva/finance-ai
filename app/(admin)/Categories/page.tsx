import { Suspense } from 'react';
import { getCategoriesWithBudget } from '@/app/_actions/categories';
import CategoriesClient from '@/app/_Components/CategoriesClient';
import CategoriesSkeleton from '@/app/_Components/categoriesSkeleton';
import { Tag } from 'lucide-react';

// Componente interno para buscar os dados
async function CategoriesList() {
  const categories = await getCategoriesWithBudget();
  return <CategoriesClient initialCategories={categories} />;
}

export default function CategoriesPage() {
  return (
    <div className='min-h-screen bg-background text-foreground font-sans p-4 sm:p-8 transition-colors duration-300'>
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesList />
      </Suspense>

      {/* DICA PRO - Renderiza imediatamente pois não depende de dados.
          Informativa, então fica plana; o roxo (ai) marca que é sobre a IA */}
      <div className='mt-8 p-4 bg-surface border-2 border-border-custom rounded-2xl flex items-start gap-3'>
        <Tag className='w-5 h-5 text-ai mt-0.5 shrink-0' aria-hidden='true' />
        <div>
          <h4 className='text-sm font-bold text-foreground lowercase'>
            Dica Pro
          </h4>
          <p className='text-xs text-muted-foreground mt-1 font-medium'>
            Mantenha nomes simples. Isso ajuda a Inteligência Artificial a
            classificar seus extratos com precisão.
          </p>
        </div>
      </div>
    </div>
  );
}
