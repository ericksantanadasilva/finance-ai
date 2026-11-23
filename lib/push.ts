// Notificações push pelo Expo (ver "Push" em docs/PLANO_API_MOBILE.md).
import { prisma } from '@/lib/prisma';

export type PushPlatform = 'android' | 'ios';

const EXPO_SEND_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const SEND_BATCH_SIZE = 100; // limite da Expo por requisição de envio
const RECEIPTS_BATCH_SIZE = 1000; // limite da Expo por consulta de recibos
// Recibos ficam prontos uns 15 min depois do envio e a Expo os guarda por ~24 h
const RECEIPTS_READY_MS = 15 * 60 * 1000;
const RECEIPTS_KEPT_MS = 24 * 60 * 60 * 1000;

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

/** Aparelhos que podem receber push: ativos e com a sessão do app ainda válida. */
export async function getActivePushDevices(userIds: string[]) {
  return prisma.pushDevice.findMany({
    where: {
      userId: { in: userIds },
      disabledAt: null,
      mobileSession: { revokedAt: null, expiresAt: { gt: new Date() } },
    },
    select: { id: true, userId: true, expoPushToken: true },
  });
}

export type PushMessage = {
  deviceId: string;
  expoPushToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>; // ex.: { url } para o app abrir a tela certa
};

/** Resultado de cada mensagem, na mesma ordem da entrada. */
export type PushSendResult =
  | { deviceId: string; status: 'ok'; ticketId: string }
  | { deviceId: string; status: 'error'; error: string }
  | { deviceId: string; status: 'failed' }; // o lote não chegou à Expo

export type PushTicketRef = { deviceId: string; ticketId: string };

type ExpoTicket =
  | { status: 'ok'; id: string }
  | { status: 'error'; message?: string; details?: { error?: string } };

type ExpoReceipt =
  | { status: 'ok' }
  | { status: 'error'; message?: string; details?: { error?: string } };

function expoHeaders() {
  const token = process.env.EXPO_ACCESS_TOKEN;
  if (!token) {
    // Com o Enhanced Security ligado no expo.dev, a Expo recusa envio sem o token
    throw new Error('EXPO_ACCESS_TOKEN ausente');
  }
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function disableDevices(deviceIds: string[]) {
  if (deviceIds.length === 0) return 0;
  const result = await prisma.pushDevice.updateMany({
    where: { id: { in: deviceIds }, disabledAt: null },
    data: { disabledAt: new Date() },
  });
  return result.count;
}

/**
 * Envia em lotes de 100. Um lote que falha (rede, 4xx/5xx) não interrompe os
 * outros: as mensagens dele voltam como 'failed', para quem chamou decidir se
 * tenta de novo. DeviceNotRegistered no ticket desativa o aparelho na hora.
 */
export async function sendPushMessages(messages: PushMessage[]) {
  const headers = expoHeaders();
  const results: PushSendResult[] = [];

  for (const batch of chunk(messages, SEND_BATCH_SIZE)) {
    let tickets: ExpoTicket[] | null = null;
    try {
      const res = await fetch(EXPO_SEND_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(
          batch.map((m) => ({
            to: m.expoPushToken,
            title: m.title,
            body: m.body,
            data: m.data,
            sound: 'default',
            channelId: 'default', // canal que o app cria no Android
          })),
        ),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && Array.isArray(json?.data) && json.data.length === batch.length) {
        tickets = json.data;
      } else {
        console.error('Expo recusou o lote de push:', res.status, json?.errors ?? json);
      }
    } catch (error) {
      console.error('Erro ao enviar lote de push:', error);
    }

    batch.forEach((m, i) => {
      const ticket = tickets?.[i];
      if (!ticket) {
        results.push({ deviceId: m.deviceId, status: 'failed' });
      } else if (ticket.status === 'ok') {
        results.push({ deviceId: m.deviceId, status: 'ok', ticketId: ticket.id });
      } else {
        const error = ticket.details?.error ?? ticket.message ?? 'unknown';
        results.push({ deviceId: m.deviceId, status: 'error', error });
      }
    });
  }

  const unregistered = results
    .filter((r) => r.status === 'error' && r.error === 'DeviceNotRegistered')
    .map((r) => r.deviceId);
  const disabled = await disableDevices(unregistered);

  const otherErrors = results.filter(
    (r) => r.status === 'error' && r.error !== 'DeviceNotRegistered',
  );
  if (otherErrors.length > 0) {
    // Só o id do aparelho: o token é uma credencial de envio
    console.error('Tickets de push com erro:', otherErrors);
  }

  return { results, disabled };
}

/** Tickets do log no formato gravado pelo dispatch; ignora o que não reconhecer. */
function parseTickets(value: unknown): PushTicketRef[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (t): t is PushTicketRef =>
      typeof t?.deviceId === 'string' && typeof t?.ticketId === 'string',
  );
}

/**
 * Confere os recibos dos envios com mais de 15 min que ainda não foram
 * conferidos. No Android o DeviceNotRegistered costuma aparecer só aqui.
 * Logs com mais de 24 h são só marcados: a Expo já descartou os recibos.
 * Se a consulta falhar, os logs ficam para a próxima execução.
 */
export async function checkPushReceipts() {
  const now = Date.now();
  const logs = await prisma.notificationLog.findMany({
    where: {
      receiptsCheckedAt: null,
      sentAt: { lte: new Date(now - RECEIPTS_READY_MS) },
    },
    select: { id: true, sentAt: true, tickets: true },
  });

  const expiredIds = logs
    .filter((l) => l.sentAt.getTime() < now - RECEIPTS_KEPT_MS)
    .map((l) => l.id);
  const pending = logs.filter((l) => !expiredIds.includes(l.id));
  const tickets = pending.flatMap((l) => parseTickets(l.tickets));
  const deviceByTicket = new Map(tickets.map((t) => [t.ticketId, t.deviceId]));

  const unregistered: string[] = [];
  let failed = false;
  const batches = chunk([...deviceByTicket.keys()], RECEIPTS_BATCH_SIZE);
  const headers = batches.length > 0 ? expoHeaders() : undefined;

  for (const ids of batches) {
    try {
      const res = await fetch(EXPO_RECEIPTS_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ids }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || typeof json?.data !== 'object' || json.data === null) {
        console.error('Expo recusou a consulta de recibos:', res.status, json?.errors ?? json);
        failed = true;
        continue;
      }
      for (const [ticketId, receipt] of Object.entries(
        json.data as Record<string, ExpoReceipt>,
      )) {
        if (receipt.status !== 'error') continue;
        const error = receipt.details?.error ?? receipt.message ?? 'unknown';
        const deviceId = deviceByTicket.get(ticketId);
        if (error === 'DeviceNotRegistered' && deviceId) {
          unregistered.push(deviceId);
        } else {
          console.error('Recibo de push com erro:', { deviceId, error });
        }
      }
    } catch (error) {
      console.error('Erro ao consultar recibos de push:', error);
      failed = true;
    }
  }

  const disabled = await disableDevices(unregistered);
  // Com falha na consulta, marca só os expirados; os outros tentam de novo depois
  const checkedIds = failed ? expiredIds : logs.map((l) => l.id);
  if (checkedIds.length > 0) {
    await prisma.notificationLog.updateMany({
      where: { id: { in: checkedIds } },
      data: { receiptsCheckedAt: new Date() },
    });
  }

  return { checked: checkedIds.length, disabled };
}
