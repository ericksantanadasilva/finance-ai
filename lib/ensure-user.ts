import type { User as SupabaseUser } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

/**
 * O login fica no Supabase, mas categorias, metas e transações apontam para a
 * tabela User do Prisma. Garante que a linha exista antes de criar dados.
 */
export async function ensureDbUser(user: SupabaseUser) {
  await prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email! },
    create: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.user_metadata?.name || 'Usuário',
    },
  });
}
