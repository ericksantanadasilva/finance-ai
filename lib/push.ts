// Notificações push pelo Expo (ver "Push" em docs/PLANO_API_MOBILE.md).
import { prisma } from '@/lib/prisma';

export type PushPlatform = 'android' | 'ios';

/**
 * Registra o aparelho da sessão ou renova o registro. O token é único: se o
 * mesmo celular entrar com outra conta, o registro passa para o usuário e a
 * sessão atuais e volta a ficar ativo.
 */
export async function registerPushDevice(
  userId: string,
  mobileSessionId: string,
  expoPushToken: string,
  platform: PushPlatform,
) {
  const owner = { userId, mobileSessionId, platform, disabledAt: null };
  return prisma.pushDevice.upsert({
    where: { expoPushToken },
    create: { expoPushToken, ...owner },
    update: { ...owner, lastSeenAt: new Date() },
    select: { id: true },
  });
}

/** Desativa o aparelho do usuário. Retorna false se não existir ou for de outro usuário. */
export async function disablePushDevice(userId: string, id: string) {
  const result = await prisma.pushDevice.updateMany({
    where: { id, userId },
    data: { disabledAt: new Date() },
  });
  return result.count > 0;
}
