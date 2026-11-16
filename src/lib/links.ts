// Links para fora do app: compartilhar, abrir no mapa e adicionar à agenda.
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { Linking, Platform, Share } from 'react-native';

/** Endereço público do site (fallback para o app nativo, que não tem window.location). */
const PUBLIC_SITE = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://augustonvsilva.github.io/campus';

/** URL completa de uma rota do app, ex.: siteUrl('/evento/123'). */
export function siteUrl(path: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const base = (Constants.expoConfig?.experiments as { baseUrl?: string } | undefined)?.baseUrl ?? '';
    return `${window.location.origin}${base}${path}`;
  }
  return `${PUBLIC_SITE}${path}`;
}

/** Compartilha (menu do sistema) ou, sem ele, copia o link. Retorna 'copied' quando copiou. */
export async function shareLink(title: string, path: string): Promise<'shared' | 'copied'> {
  const url = siteUrl(path);
  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }) : undefined;
    if (nav?.share) {
      try {
        await nav.share({ title, text: title, url });
        return 'shared';
      } catch {
        // Cancelado ou sem permissão: cai para copiar.
      }
    }
    await Clipboard.setStringAsync(url);
    return 'copied';
  }
  await Share.share({ message: `${title}\n${url}` });
  return 'shared';
}

export function openMap(place: string, city?: string) {
  const q = city && !place.toLowerCase().includes(city.toLowerCase()) ? `${place}, ${city}` : place;
  return Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
}

export interface CalendarItem { title: string; start: number; end: number; location?: string; details?: string }

const icsDate = (t: number) => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Google Agenda (abre no navegador ou no app do Google). */
export function openGoogleCalendar(item: CalendarItem) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: item.title,
    dates: `${icsDate(item.start)}/${icsDate(item.end)}`,
    details: item.details ?? '',
    location: item.location ?? '',
  });
  return Linking.openURL(`https://calendar.google.com/calendar/render?${params.toString()}`);
}

/** Só no site: baixa um .ics (Apple Calendar, Outlook e outros abrem direto). */
export function downloadIcs(item: CalendarItem) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => `\\${m}`);
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Campus//PT-BR', 'BEGIN:VEVENT',
    `UID:${item.start}-${encodeURIComponent(item.title)}@campus`, `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(item.start)}`, `DTEND:${icsDate(item.end)}`, `SUMMARY:${esc(item.title)}`,
    item.location ? `LOCATION:${esc(item.location)}` : '', item.details ? `DESCRIPTION:${esc(item.details)}` : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.title.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'evento'}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
