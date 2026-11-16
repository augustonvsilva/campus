// Venda de ingressos (modo demonstração): preços, disponibilidade e validação do cartão.
import type { CampusEvent, ID, Ticket, TicketLot } from './types';

export const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** "40" ou "40,50" → centavos (null se inválido). */
export function parseBRL(text: string): number | null {
  const t = text.trim().replace(/^R\$\s*/i, '').replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Math.round(Number(t) * 100);
}

/** Vendidos de um lote: base do lote + ingressos emitidos no aparelho. */
export const soldOf = (lot: TicketLot, tickets: Ticket[]) => lot.sold + tickets.filter((t) => t.lotId === lot.id).length;
export const remainingOf = (lot: TicketLot, tickets: Ticket[]) => Math.max(0, lot.quantity - soldOf(lot, tickets));

/** Quem pode ver vendas e validar ingressos do evento. */
export function canManageEvent(event: CampusEvent, me: ID, isGroupAdmin: boolean, isModerator: boolean) {
  return event.createdBy === me || isGroupAdmin || isModerator;
}

/** Código do ingresso: 10 caracteres fáceis de ler (sem 0/O/1/I). */
export function ticketCode(random: Uint8Array) {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(random.slice(0, 10), (b) => abc[b % abc.length]).join('');
}

// ── Cartão ──
export const onlyDigits = (s: string) => s.replace(/\D/g, '');

/** Algoritmo de Luhn: detecta número de cartão digitado errado. */
export function luhn(num: string) {
  const d = onlyDigits(num);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  return sum % 10 === 0;
}

export function cardBrand(num: string): string {
  const d = onlyDigits(num);
  if (/^4/.test(d)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(d)) return 'Elo';
  if (/^(606282|3841)/.test(d)) return 'Hipercard';
  return '';
}

/** "1234567812345678" → "1234 5678 1234 5678". */
export const formatCard = (s: string) => onlyDigits(s).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
/** "1228" → "12/28". */
export const formatExpiry = (s: string) => {
  const d = onlyDigits(s).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function expiryOk(mmYY: string, now = new Date()) {
  const m = /^(\d{2})\/(\d{2})$/.exec(mmYY);
  if (!m) return false;
  const month = Number(m[1]), year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}
