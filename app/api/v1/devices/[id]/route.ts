import { NextResponse } from 'next/server';
import { requireMobileUser } from '@/lib/api-auth';
import { notFoundResponse } from '@/lib/api-validation';
import { disablePushDevice } from '@/lib/push';

type Context = { params: Promise<{ id: string }> };

/** Para de enviar push ao aparelho. O app chama antes do /auth/logout. */
export async function DELETE(request: Request, { params }: Context) {
  const { user, errorResponse } = await requireMobileUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    const disabled = await disablePushDevice(user.id, id);
    if (!disabled) return notFoundResponse();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao remover aparelho (mobile):', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
