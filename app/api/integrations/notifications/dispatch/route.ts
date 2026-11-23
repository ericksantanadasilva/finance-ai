import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-auth';
import { dispatchNotifications } from '@/lib/notifications';

/**
 * Avisos push do dia (o n8n chama às 9h e de novo às 9h30, para conferir os
 * recibos; a chave única do log impede repetir um aviso).
 * `?dryRun=1` devolve o que seria enviado, sem enviar nem gravar log.
 */
export async function POST(request: Request) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';
  try {
    const result = await dispatchNotifications({ dryRun });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro no dispatch de notificações:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
