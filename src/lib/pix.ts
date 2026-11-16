// Pix "copia e cola" (BR Code estático, padrão EMV do Banco Central).
// O mesmo texto vira o QR code que o app do banco lê. Valor e identificador já vão embutidos.

/** Campo EMV: id (2 dígitos) + tamanho (2 dígitos) + valor. */
const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), exigido no fim do BR Code. */
function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Sem acentos e só caracteres aceitos pelo padrão (nome e cidade do recebedor). */
const plain = (s: string, max: number) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 .-]/g, '').trim().slice(0, max) || 'CAMPUS';

export function pixPayload({ key, amountCents, name, city, txid, description }: {
  key: string; amountCents: number; name: string; city: string; txid: string; description?: string;
}) {
  const account = field('00', 'br.gov.bcb.pix') + field('01', key.trim())
    + (description ? field('02', plain(description, 40)) : '');
  const payload = [
    field('00', '01'),
    field('26', account),
    field('52', '0000'),
    field('53', '986'),
    field('54', (amountCents / 100).toFixed(2)),
    field('58', 'BR'),
    field('59', plain(name, 25)),
    field('60', plain(city, 15)),
    field('62', field('05', txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***')),
  ].join('') + '6304';
  return payload + crc16(payload);
}
