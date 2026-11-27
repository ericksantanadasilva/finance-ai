// Avisos diários por push (ver "Push" em docs/PLANO_API_MOBILE.md). Chamado pela
// rota dispatch do n8n; recebe `now` para o teste poder fixar o dia.
import { isUniqueViolation, prisma } from '@/lib/prisma';
import { APP_TIME_ZONE } from '@/app/utils/dates';
import { getCategoriesWithBudget } from '@/lib/finance/categories';
import { generateForUser } from '@/lib/finance/recurring';
import {
  checkPushReceipts,
  getActivePushDevices,
  sendPushMessages,
  type PushMessage,
} from '@/lib/push';

type NotificationKind = 'due' | 'overdue' | 'budget';

type PlannedNotification = {
  userId: string;
  kind: NotificationKind;
  dedupeKeys: string[]; // o primeiro guarda os tickets do envio
  title: string;
  body: string;
  url: string; // tela que o app abre ao tocar
};

type Preferences = Record<NotificationKind, boolean>;

// null: nada a avisar; 'already-sent': havia o que avisar, mas já foi avisado
type PlanResult = PlannedNotification | 'already-sent' | null;

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** "YYYY-MM-DD" do instante no fuso do app. */
function dayIn(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Semana ISO ("2026-W48") de um dia "YYYY-MM-DD". */
function isoWeek(day: string) {
  const date = new Date(`${day}T12:00:00Z`);
  const weekday = date.getUTCDay() || 7; // segunda = 1 ... domingo = 7
  date.setUTCDate(date.getUTCDate() + 4 - weekday); // quinta-feira da semana
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil((date.getTime() - yearStart) / 86400000 / 7 + 1 / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Preferências em User.settings.notifications; tudo ligado quando não definido. */
function preferencesOf(settings: unknown): Preferences {
  const n =
    typeof settings === 'object' &&
    settings !== null &&
    'notifications' in settings
      ? (settings as { notifications?: unknown }).notifications
      : undefined;
  const prefs =
    typeof n === 'object' && n !== null ? (n as Record<string, unknown>) : {};
  return {
    due: prefs.due !== false,
    overdue: prefs.overdue !== false,
    budget: prefs.budget !== false,
  };
}

function listNames(names: string[]) {
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} e mais ${names.length - 3}`;
}

/**
 * Despesas pendentes com vencimento (date) hoje. Desde a 4j a data de uma
 * pendente lançada é o vencimento; as lançadas hoje ficam fora, para não avisar
 * do que a pessoa acabou de registrar. Ocorrências de recorrência contam mesmo
 * geradas hoje (senão a regra com dia 1 nunca avisaria).
 */
async function planDue(
  userId: string,
  today: string,
  sentKeys: Set<string>,
): Promise<PlanResult> {
  // As datas sem horário são gravadas perto do meio-dia UTC (parseDateOnly e recorrências)
  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      isPaid: false,
      date: {
        gte: new Date(`${today}T00:00:00Z`),
        lt: new Date(new Date(`${today}T00:00:00Z`).getTime() + 86400000),
      },
    },
    select: {
      id: true,
      description: true,
      amount: true,
      createdAt: true,
      recurringRuleId: true,
    },
    orderBy: { amount: 'desc' },
  });
  const candidates = rows.filter(
    (t) => t.recurringRuleId !== null || dayIn(t.createdAt) !== today,
  );
  if (candidates.length === 0) return null;
  // Num segundo disparo do dia, avisa só as contas que ainda não foram avisadas
  const due = candidates.filter((t) => !sentKeys.has(`due:${t.id}`));
  if (due.length === 0) return 'already-sent';

  const total = due.reduce((acc, t) => acc + Number(t.amount), 0);
  return {
    userId,
    kind: 'due',
    dedupeKeys: due.map((t) => `due:${t.id}`),
    title:
      due.length === 1
        ? 'Conta vence hoje'
        : `${due.length} contas vencem hoje`,
    body:
      due.length === 1
        ? `${due[0].description}: ${money(total)}`
        : `${listNames(due.map((t) => t.description))} · ${money(total)}`,
    url: '/transactions?status=pending',
  };
}

/** Despesas pendentes com competência anterior ao mês atual (regra do selo da 4i). Só às segundas. */
async function planOverdue(
  userId: string,
  today: string,
  sentKeys: Set<string>,
): Promise<PlanResult> {
  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      isPaid: false,
      referenceDate: { lt: new Date(`${today.slice(0, 7)}-01T00:00:00Z`) },
    },
    select: { amount: true },
  });
  if (rows.length === 0) return null;
  const key = `overdue:${isoWeek(today)}`;
  if (sentKeys.has(key)) return 'already-sent';

  const total = rows.reduce((acc, t) => acc + Number(t.amount), 0);
  return {
    userId,
    kind: 'overdue',
    dedupeKeys: [key],
    title:
      rows.length === 1
        ? '1 conta atrasada'
        : `${rows.length} contas atrasadas`,
    body: `${money(total)} de meses anteriores ainda a pagar`,
    url: '/transactions?status=pending',
  };
}

/**
 * Categorias acima de 80% / 100% do limite no mês. Uma vez por limiar no mês;
 * se os dois chegarem juntos, o texto fala só do 100% e as duas chaves são gravadas.
 */
async function planBudget(
  userId: string,
  month: string,
  sentKeys: Set<string>,
): Promise<PlanResult> {
  const categories = await getCategoriesWithBudget(userId, month);
  const alerts: { name: string; percent: number; keys: string[] }[] = [];
  let alreadySent = false;

  for (const c of categories) {
    if (c.percent === null || c.percent < 80) continue;
    const key80 = `budget:${c.id}:${month}:80`;
    const key100 = `budget:${c.id}:${month}:100`;
    const key = c.percent >= 100 ? key100 : key80;
    if (sentKeys.has(key)) {
      alreadySent = true;
      continue;
    }
    const keys = c.percent >= 100 ? [key100, key80] : [key80];
    alerts.push({
      name: c.name,
      percent: c.percent,
      keys: keys.filter((k) => !sentKeys.has(k)),
    });
  }
  if (alerts.length === 0) return alreadySent ? 'already-sent' : null;

  const describe = (a: (typeof alerts)[number]) =>
    a.percent >= 100
      ? `${a.name} estourou (${Math.round(a.percent)}%)`
      : `${a.name} em ${Math.round(a.percent)}%`;
  return {
    userId,
    kind: 'budget',
    dedupeKeys: alerts.flatMap((a) => a.keys),
    title:
      alerts.length === 1
        ? alerts[0].percent >= 100
          ? `Orçamento de ${alerts[0].name} estourado`
          : `${alerts[0].name} passou de 80% do orçamento`
        : `${alerts.length} categorias passaram de 80% do orçamento`,
    body: alerts.map(describe).join(', '),
    url: '/more/categories',
  };
}

export type DispatchResult = {
  dryRun: boolean;
  users: number; // usuários com aparelho ativo
  notifications: {
    userId: string;
    kind: NotificationKind;
    title: string;
    body: string;
  }[];
  sent: number; // avisos com pelo menos um ticket ok
  failed: number; // avisos que não chegaram à Expo (o log é apagado para tentar de novo)
  skipped: number; // avisos que já tinham sido enviados (chave única no log)
  disabled: number; // aparelhos desativados (tickets + recibos)
  receiptsChecked: number;
};

/**
 * Confere os recibos anteriores, gera as recorrências devidas e envia os avisos
 * de cada usuário com aparelho ativo. Com dryRun, só calcula: não confere
 * recibos, não grava log e não envia (as recorrências são geradas como em
 * qualquer abertura de página).
 */
export async function dispatchNotifications({
  now = new Date(),
  dryRun = false,
}: { now?: Date; dryRun?: boolean } = {}): Promise<DispatchResult> {
  const receipts = dryRun
    ? { checked: 0, disabled: 0 }
    : await checkPushReceipts();

  const today = dayIn(now);
  const month = today.slice(0, 7);
  const isMonday = new Date(`${today}T12:00:00Z`).getUTCDay() === 1;

  const devices = await getActivePushDevices();
  const userIds = [...new Set(devices.map((d) => d.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, settings: true },
  });

  const planned: PlannedNotification[] = [];
  let skipped = 0;
  for (const user of users) {
    await generateForUser(user.id);
    const prefs = preferencesOf(user.settings);
    const sentKeys = new Set(
      (
        await prisma.notificationLog.findMany({
          where: {
            userId: user.id,
            sentAt: { gte: new Date(now.getTime() - 40 * 86400000) },
          },
          select: { dedupeKey: true },
        })
      ).map((l) => l.dedupeKey),
    );

    const results = await Promise.all([
      prefs.due ? planDue(user.id, today, sentKeys) : null,
      prefs.overdue && isMonday ? planOverdue(user.id, today, sentKeys) : null,
      prefs.budget ? planBudget(user.id, month, sentKeys) : null,
    ]);
    for (const r of results) {
      if (r === 'already-sent') skipped += 1;
      else if (r) planned.push(r);
    }
  }

  const summary = planned.map(({ userId, kind, title, body }) => ({
    userId,
    kind,
    title,
    body,
  }));
  const result: DispatchResult = {
    dryRun,
    users: users.length,
    notifications: summary,
    sent: 0,
    failed: 0,
    skipped,
    disabled: receipts.disabled,
    receiptsChecked: receipts.checked,
  };
  if (dryRun || planned.length === 0) return result;

  // Grava o log antes de enviar: a chave única faz uma execução simultânea pular o aviso
  const claimed: { notification: PlannedNotification; logIds: string[] }[] = [];
  for (const n of planned) {
    try {
      const logIds = await prisma.$transaction(
        n.dedupeKeys.map((dedupeKey) =>
          prisma.notificationLog.create({
            data: { userId: n.userId, kind: n.kind, dedupeKey, sentAt: now },
            select: { id: true },
          }),
        ),
      );
      claimed.push({ notification: n, logIds: logIds.map((l) => l.id) });
    } catch (error) {
      if (isUniqueViolation(error)) {
        result.skipped += 1;
        continue;
      }
      throw error;
    }
  }

  const messages: (PushMessage & { claimIndex: number })[] = [];
  claimed.forEach(({ notification: n }, claimIndex) => {
    for (const d of devices.filter((d) => d.userId === n.userId)) {
      messages.push({
        claimIndex,
        deviceId: d.id,
        expoPushToken: d.expoPushToken,
        title: n.title,
        body: n.body,
        data: { url: n.url, kind: n.kind },
      });
    }
  });

  let sendResults: Awaited<ReturnType<typeof sendPushMessages>>['results'];
  try {
    const sent = await sendPushMessages(messages);
    sendResults = sent.results;
    result.disabled += sent.disabled;
  } catch (error) {
    // Ex.: EXPO_ACCESS_TOKEN ausente. Solta as chaves para a próxima execução
    await prisma.notificationLog.deleteMany({
      where: { id: { in: claimed.flatMap((c) => c.logIds) } },
    });
    throw error;
  }

  for (const [claimIndex, { logIds }] of claimed.entries()) {
    const own = sendResults.filter(
      (_, i) => messages[i].claimIndex === claimIndex,
    );
    const tickets = own.flatMap((r) =>
      r.status === 'ok' ? [{ deviceId: r.deviceId, ticketId: r.ticketId }] : [],
    );
    if (own.every((r) => r.status === 'failed')) {
      await prisma.notificationLog.deleteMany({
        where: { id: { in: logIds } },
      });
      result.failed += 1;
      continue;
    }
    if (tickets.length > 0) {
      await prisma.notificationLog.update({
        where: { id: logIds[0] },
        data: { tickets },
      });
      result.sent += 1;
    }
  }

  return result;
}
