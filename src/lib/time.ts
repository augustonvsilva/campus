import { useEffect, useState } from 'react';

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Timestamp de hoje + `days`, no horário indicado. */
export function at(days: number, hour: number, minute = 0, now = Date.now()) {
  const d = new Date(startOfDay(now) + days * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

export function hhmm(ts: number) {
  const d = new Date(ts);
  const m = d.getMinutes();
  return m ? `${d.getHours()}h${String(m).padStart(2, '0')}` : `${d.getHours()}h`;
}

export function dayLabel(ts: number, now = Date.now()) {
  const diff = Math.round((startOfDay(ts) - startOfDay(now)) / DAY);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  const d = new Date(ts);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function when(ts: number, now = Date.now()) {
  return `${dayLabel(ts, now)} · ${hhmm(ts)}`;
}

/** Igual a `when`, para usar no meio de frases ("sai amanhã · 17h15"). */
export function whenInline(ts: number, now = Date.now()) {
  return when(ts, now).replace(/^(Hoje|Amanhã|Ontem)/, (m) => m.toLowerCase());
}

export function shortDate(ts: number) {
  const d = new Date(ts);
  return { day: String(d.getDate()), month: MONTHS[d.getMonth()] ?? '' };
}

export function ago(ts: number, now = Date.now()) {
  const s = now - ts;
  if (s < MIN) return 'agora';
  if (s < HOUR) return `há ${Math.floor(s / MIN)} min`;
  if (s < DAY) return `há ${Math.floor(s / HOUR)} h`;
  if (s < 2 * DAY) return 'ontem';
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function validUntil(ts: number, now = Date.now()) {
  const day = dayLabel(ts, now);
  return `vale até ${day === 'Hoje' ? '' : day.toLowerCase() + ' '}${hhmm(ts)}`;
}

/** "em 40 min", "em 2 h", "agora", "começou há 10 min". */
export function relativeStart(ts: number, now = Date.now()) {
  const s = ts - now;
  if (Math.abs(s) < 5 * MIN) return 'agora';
  if (s > 0) {
    if (s < HOUR) return `em ${Math.round(s / MIN)} min`;
    if (s < 12 * HOUR) return `em ${Math.round(s / HOUR)} h`;
    return when(ts, now);
  }
  return `começou ${ago(ts, now)}`;
}

/** Interpreta "dd/mm" + "hh:mm" (ano corrente, ou o próximo se a data já passou). */
export function parseDateTime(date: string, time: string, now = Date.now()): number | null {
  const dm = /^(\d{1,2})\/(\d{1,2})$/.exec(date.trim());
  const hm = /^(\d{1,2})(?::|h)?(\d{2})?$/.exec(time.trim());
  if (!dm || !hm) return null;
  const day = Number(dm[1]);
  const month = Number(dm[2]) - 1;
  const hour = Number(hm[1]);
  const minute = Number(hm[2] ?? 0);
  if (month < 0 || month > 11 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const year = new Date(now).getFullYear();
  let d = new Date(year, month, day, hour, minute);
  if (d.getDate() !== day) return null;
  if (d.getTime() < now - DAY) d = new Date(year + 1, month, day, hour, minute);
  return d.getTime();
}

/** Re-renderiza periodicamente para manter "há X min" e o Agora atualizados. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
