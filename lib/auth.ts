import { createClient } from '@/lib/supabase/server';

/** Usuário da sessão atual (cookies do Supabase) ou null. */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Usuário da sessão atual; lança erro se não houver sessão. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autorizado');
  return user;
}
