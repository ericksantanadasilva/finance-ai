'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureDbUser } from '@/lib/ensure-user';
import { redirect } from 'next/navigation';

export async function loginWithEmail(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { data: session, error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  await ensureDbUser(session.user);
  redirect('/Dashboard');
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
      },
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  redirect('/?message=confirm_email');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
