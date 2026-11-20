'use client';

import { use, useRef, useState } from 'react';
import { ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Mensagem do login por e-mail/senha: só ela marca os campos como inválidos
// (o erro do Google, vindo da URL, não tem relação com os campos)
const CREDENTIALS_ERROR = 'E-mail ou senha inválidos.';

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = use(searchParams);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(
    params.error ? 'Não foi possível entrar com o Google. Tente novamente.' : null,
  );

  // Depois de um login que falha, o foco volta para o e-mail para corrigir
  const emailRef = useRef<HTMLInputElement>(null);
  const fieldsInvalid = error === CREDENTIALS_ERROR;

  const handleGoogleLogin = () => signIn('google', { callbackUrl: '/Dashboard' });

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });
    if (result?.ok) {
      window.location.assign('/Dashboard');
      return;
    }
    setError(CREDENTIALS_ERROR);
    setIsPending(false);
    emailRef.current?.focus();
  }

  return (
    <div className='min-h-dvh bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300'>
      {/* FORMAS DO FUNDO: decorativas, atrás do card e sem receber clique */}
      <Blob
        className='-top-28 -left-28 size-80 sm:size-112 rotate-12'
        color='var(--highlight)'
      />
      <Blob
        className='-bottom-32 -right-28 size-88 sm:size-120 -rotate-20'
        color='var(--ai)'
      />

      <Card className='w-full max-w-md shadow-hard-lg relative z-10 p-6 sm:p-8'>
        <div className='text-center mb-8'>
          {/* Logo: o mesmo quadrado magenta da sidebar */}
          <div className='inline-flex items-center gap-2 mb-6'>
            <span
              aria-hidden='true'
              className='size-10 bg-highlight text-highlight-foreground border-2 border-ink rounded-lg flex items-center justify-center shadow-hard-sm'
            >
              <span className='font-black text-xl'>F</span>
            </span>
            <span className='font-display font-bold text-xl'>Finance.ai</span>
          </div>
          <h1 className='text-xl sm:text-2xl font-bold lowercase mb-2'>
            Bem-vindo ao Finance.ai
          </h1>
          <p className='text-muted-foreground text-sm font-medium'>
            Organize suas finanças com o poder da IA.
          </p>
        </div>

        {/* Social Login (secundário: outline) */}
        <div className='space-y-3 mb-6'>
          <Button
            variant='outline'
            size='lg'
            onClick={handleGoogleLogin}
            className='w-full text-foreground hover:border-ink'
          >
            <svg className='w-5 h-5' viewBox='0 0 24 24' aria-hidden='true'>
              <path
                fill='currentColor'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='currentColor'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='currentColor'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='currentColor'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            Entrar com Google
          </Button>
        </div>

        <div className='relative mb-6'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-border-custom'></div>
          </div>
          <div className='relative flex justify-center text-xs font-medium lowercase'>
            <span className='bg-surface px-2 text-muted-foreground'>
              Ou continue com email
            </span>
          </div>
        </div>

        {/* role="alert": o leitor de tela anuncia o erro assim que aparece.
            Visual: o mesmo estilo de erro do app (contorno expense + ícone) */}
        {error && (
          <div
            id='login-error'
            role='alert'
            className='flex items-start gap-2 rounded-xl border-2 border-expense bg-surface p-3 text-sm font-medium mb-4'
          >
            <AlertTriangle
              className='w-4 h-4 shrink-0 mt-0.5 text-expense'
              aria-hidden='true'
            />
            {error}
          </div>
        )}

        {/* Form chamando a Server Action */}
        <form action={handleSubmit} className='space-y-4'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='login-email'>Email</Label>
            {/* aria-invalid: contorno de erro do fieldVariants */}
            <Input
              ref={emailRef}
              id='login-email'
              name='email'
              type='email'
              autoComplete='email'
              required
              aria-invalid={fieldsInvalid}
              aria-describedby={fieldsInvalid ? 'login-error' : undefined}
              placeholder='seu@email.com'
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='login-password'>Senha</Label>
            <Input
              id='login-password'
              name='password'
              type='password'
              autoComplete='current-password'
              required
              aria-invalid={fieldsInvalid}
              aria-describedby={fieldsInvalid ? 'login-error' : undefined}
              placeholder='••••••••'
            />
          </div>
          <Button
            disabled={isPending}
            type='submit'
            size='lg'
            className='w-full'
          >
            {isPending ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' aria-hidden='true' />
                {/* Sem isso o botão fica sem nome enquanto carrega */}
                <span className='sr-only'>Entrando...</span>
              </>
            ) : (
              <>
                Acessar Painel{' '}
                <ArrowRight className='w-4 h-4' aria-hidden='true' />
              </>
            )}
          </Button>
        </form>

        <p className='mt-6 text-center text-xs font-medium text-muted-foreground'>
          Não tem uma conta? Entre com o Google para criar.
        </p>
      </Card>
    </div>
  );
}

// Forma orgânica do fundo (referência): preenchida com um token de destaque e
// contornada com ink, como os adesivos. Só decoração.
function Blob({ className, color }: { className: string; color: string }) {
  return (
    <svg
      viewBox='0 0 200 200'
      aria-hidden='true'
      className={`pointer-events-none absolute ${className}`}
    >
      <path
        transform='translate(100 100)'
        d='M44.7,-58.6C57.1,-46.7,65.9,-31.8,69.6,-15.6C73.3,0.6,71.9,18.1,63.9,31.7C55.9,45.3,41.3,55,25.4,61.8C9.5,68.6,-7.7,72.5,-23.6,68.4C-39.5,64.3,-54.1,52.2,-63.2,36.9C-72.3,21.6,-75.9,3.1,-71.7,-13.2C-67.5,-29.5,-55.5,-43.6,-41.6,-55.3C-27.7,-67,-13.9,-76.3,1.3,-77.9C16.5,-79.5,32.3,-70.5,44.7,-58.6Z'
        style={{ fill: color, stroke: 'var(--ink)', strokeWidth: 3 }}
        vectorEffect='non-scaling-stroke'
      />
    </svg>
  );
}
