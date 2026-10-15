import { Suspense } from 'react';
import { generateDueRecurring, getRecurringRules } from '@/app/_actions/recurring';
import { getCategories } from '@/app/_actions/categories';
import RecurringClient from '@/app/_Components/RecurringClient';
import CategoriesSkeleton from '@/app/_Components/categoriesSkeleton';

export const dynamic = 'force-dynamic';

async function RecurringData() {
  // Garante que as ocorrências do mês existam antes de exibir
  await generateDueRecurring();
  const [rules, categories] = await Promise.all([
    getRecurringRules(),
    getCategories(),
  ]);

  return (
    <RecurringClient
      initialRules={rules}
      categoryNames={categories.map((c) => c.name)}
    />
  );
}

export default function RecurringPage() {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <RecurringData />
    </Suspense>
  );
}
