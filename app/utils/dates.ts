// Fuso usado no servidor para decidir "hoje" e "mês atual" (o servidor roda em UTC).
export const APP_TIME_ZONE = 'America/Sao_Paulo';

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "YYYY-MM-DD" de hoje. Sem timeZone usa o fuso local (navegador). */
export function todayISO(timeZone?: string) {
  // en-CA formata como YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** "YYYY-MM" do mês atual. Sem timeZone usa o fuso local (navegador). */
export function currentMonthISO(timeZone?: string) {
  return todayISO(timeZone).slice(0, 7);
}

/**
 * Datas sem horário ("YYYY-MM-DD") são gravadas ao meio-dia UTC: assim o dia
 * não muda ao ser exibido em nenhum fuso do Brasil.
 */
export function parseDateOnly(value: string) {
  const match = DATE_ONLY_RE.exec(value);
  if (!match) return new Date(value);
  const [, y, m, d] = match.map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/** Exibe uma data gravada com parseDateOnly (ou registros antigos à meia-noite UTC). */
export function formatDateOnly(value: string | Date) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
