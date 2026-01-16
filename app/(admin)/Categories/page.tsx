import { getCategories } from '@/app/_actions/categories';
import CategoriesClient from '@/app/_Components/CategoriesClient';
import { Tag } from 'lucide-react';

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-50 font-sans p-8'>
      <CategoriesClient initialCategories={categories} />

      <div className='mt-8 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl flex items-start gap-3'>
        <Tag className='w-5 h-5 text-purple-400 mt-0.5' />
        <div>
          <h4 className='text-sm font-bold text-purple-200'>Dica Pro</h4>
          <p className='text-xs text-purple-300/70 mt-1'>
            Mantenha nomes simples. Isso ajuda a Inteligência Artificial a
            classificar seus extratos com precisão.
          </p>
        </div>
      </div>
    </div>
  );
}
