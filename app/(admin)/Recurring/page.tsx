import { Suspense } from 'react';
import { generateDueRecurring, getRecurringRules } from '@/app/_actions/recurring';
import { getCategoryOptions } from '@/app/_actions/categories';
import RecurringClient from '@/app/_Components/RecurringClient';
import RecurringSkeleton from '@/app/_Components/RecurringSkeleton';

export const dynamic = 'force-dynamic';

async function RecurringData() {
  // Garante que as ocorrências do mês existam antes de exibir
  await generateDueRecurring();
  const [rules, categoryNames] = await Promise.all([
    getRecurringRules(),
    getCategoryOptions(),
  ]);

  return (
    <RecurringClient initialRules={rules} categoryNames={categoryNames} />
  );
}

export default function RecurringPage() {
  return (
    <Suspense fallback={<RecurringSkeleton />}>
      <RecurringData />
    </Suspense>
  );
}
