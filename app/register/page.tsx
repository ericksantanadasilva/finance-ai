'use client';

import { useState } from 'react';
import { Wallet, ArrowRight, Loader2, User } from 'lucide-react';
import { signUp } from '../auth/actions';

export default function RegisterPage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  }

  return (
    <div className='min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden'>
      {/* Background Glow */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]'></div>

      <div className='w-full max-w-md bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl rounded-2xl p-8 relative z-10 shadow-2xl'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 mb-4'>
            <User className='w-6 h-6' />
          </div>
          <h1 className='text-2xl font-bold text-white mb-2'>Crie sua conta</h1>
          <p className='text-zinc-400 text-sm'>
            Comece a organizar suas finanças hoje.
          </p>
        </div>

        {error && (
          <div className='bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs p-3 rounded-lg mb-4'>
            {error}
          </div>
        )}

        <form action={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-xs font-medium text-zinc-400 mb-1.5'>
              Nome Completo
            </label>
            <input
              name='full_name'
              type='text'
              required
              className='w-full bg-zinc-950/50 border border-zinc-800 focus:border-emerald-500 rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-zinc-700'
              placeholder='Seu nome'
            />
          </div>
          <div>
            <label className='block text-xs font-medium text-zinc-400 mb-1.5'>
              Email
            </label>
            <input
              name='email'
              type='email'
              required
              className='w-full bg-zinc-950/50 border border-zinc-800 focus:border-emerald-500 rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-zinc-700'
              placeholder='seu@email.com'
            />
          </div>
          <div>
            <label className='block text-xs font-medium text-zinc-400 mb-1.5'>
              Senha
            </label>
            <input
              name='password'
              type='password'
              required
              minLength={6}
              className='w-full bg-zinc-950/50 border border-zinc-800 focus:border-emerald-500 rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-zinc-700'
              placeholder='No mínimo 6 caracteres'
            />
          </div>

          <button
            disabled={isPending}
            type='submit'
            className='w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2'
          >
            {isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <>
                Criar Conta <ArrowRight className='w-4 h-4' />
              </>
            )}
          </button>
        </form>

        <p className='mt-6 text-center text-xs text-zinc-500'>
          Já tem uma conta?{' '}
          <a href='/' className='text-emerald-500 hover:underline'>
            Faça login
          </a>
        </p>
      </div>
    </div>
  );
}
