// Limite de tentativas do login por senha (web e app mobile usam o mesmo contador).
// Fica em memória porque o app roda em um único container: um restart zera os contadores.
import { isIP } from 'net';

const MAX_FAILURES_PER_EMAIL = 10;
const MAX_FAILURES_PER_IP = 30;
const WINDOW_MS = 15 * 60 * 1000;
// Teto para e-mails aleatórios não fazerem o Map crescer sem limite
const MAX_ENTRIES = 10_000;

type Counter = { count: number; resetAt: number };

// No globalThis porque o Next pode carregar este módulo mais de uma vez
// (rota do next-auth e rotas da v1); assim existe um único contador por processo.
const globalForLogin = globalThis as typeof globalThis & {
  loginFailures?: Map<string, Counter>;
};
const failures = (globalForLogin.loginFailures ??= new Map());

const emailKey = (email: string) => `email:${email}`;
const ipKey = (ip: string) => `ip:${ip}`;

/**
 * Remove as entradas vencidas do início do Map. Toda entrada nasce com
 * resetAt = agora + janela e só é recriada depois de apagada, então a ordem
 * de inserção é também a ordem de vencimento.
 */
function pruneExpired(now: number) {
  for (const [key, counter] of failures) {
    if (counter.resetAt > now) break;
    failures.delete(key);
  }
}

function activeCounter(key: string, now: number) {
  const counter = failures.get(key);
  if (!counter) return null;
  if (counter.resetAt <= now) {
    failures.delete(key);
    return null;
  }
  return counter;
}

function increment(key: string, now: number) {
  const counter = activeCounter(key, now);
  if (counter) {
    counter.count += 1;
    return;
  }
  // Cheio mesmo após a limpeza: descarta a entrada mais antiga
  if (failures.size >= MAX_ENTRIES) {
    const oldest = failures.keys().next().value;
    if (oldest !== undefined) failures.delete(oldest);
  }
  failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
}

/**
 * Retorna em quantos segundos o login volta a ser aceito, ou null se não houver
 * bloqueio. O e-mail deve vir normalizado (trim + minúsculas).
 */
export function getLoginBlock(email: string, ip: string | null) {
  const now = Date.now();
  const limits: [string, number][] = [[emailKey(email), MAX_FAILURES_PER_EMAIL]];
  if (ip) limits.push([ipKey(ip), MAX_FAILURES_PER_IP]);

  let blockedUntil = 0;
  for (const [key, max] of limits) {
    const counter = activeCounter(key, now);
    if (counter && counter.count >= max) {
      blockedUntil = Math.max(blockedUntil, counter.resetAt);
    }
  }

  return blockedUntil
    ? { retryAfterSeconds: Math.ceil((blockedUntil - now) / 1000) }
    : null;
}

/** Conta uma falha para o e-mail e para o IP (mesmo se o e-mail não existir). */
export function registerLoginFailure(email: string, ip: string | null) {
  const now = Date.now();
  pruneExpired(now);
  increment(emailKey(email), now);
  if (ip) increment(ipKey(ip), now);
}

/** Login certo: zera o contador do e-mail (o do IP continua valendo). */
export function clearLoginFailures(email: string) {
  failures.delete(emailKey(email));
}

type HeaderSource = Headers | Record<string, unknown> | undefined;

function readHeader(headers: HeaderSource, name: string) {
  if (!headers) return null;
  const value =
    headers instanceof Headers ? headers.get(name) : headers[name];
  return typeof value === 'string' ? value.trim() : null;
}

/**
 * IP do cliente atrás da Cloudflare: CF-Connecting-IP e, se não vier, X-Real-IP.
 * Retorna null se nenhum vier com um IP válido (nesse caso não há limite por IP).
 * Aceita `Headers` ou o objeto de headers do next-auth (chaves em minúsculas).
 */
export function getClientIp(headers: HeaderSource) {
  for (const name of ['cf-connecting-ip', 'x-real-ip']) {
    const value = readHeader(headers, name);
    if (value && isIP(value)) return value;
  }
  return null;
}
