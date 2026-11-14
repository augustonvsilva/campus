// Regras do nick (@handle) e do semestre, compartilhadas por cadastro e perfil.
// As mesmas regras valem no banco (migration 0006), que é quem garante a unicidade.

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;

/** Nicks que poderiam confundir com contas oficiais ou rotas do app. */
export const RESERVED_HANDLES = [
  'admin', 'administrador', 'campus', 'equipe', 'moderacao', 'moderador', 'suporte', 'oficial',
  'mackenzie', 'mackenzista', 'universidade', 'visitante',
];

export const SEMESTERS = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º', '11º', '12º'];

/** Minúsculas, sem @ inicial e sem espaços nas pontas. */
export function normalizeHandle(raw: string) {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

/** Mensagem explicando o problema do nick, ou null se o formato é válido (não checa se está livre). */
export function handleProblem(raw: string): string | null {
  const h = normalizeHandle(raw);
  if (h.length < HANDLE_MIN) return `O nick precisa ter pelo menos ${HANDLE_MIN} caracteres.`;
  if (h.length > HANDLE_MAX) return `O nick pode ter no máximo ${HANDLE_MAX} caracteres.`;
  if (!/^[a-z0-9._]+$/.test(h)) return 'Use só letras sem acento, números, ponto ou _ no nick.';
  if (h.startsWith('.') || h.endsWith('.') || h.includes('..')) return 'O nick não pode começar ou terminar com ponto, nem ter dois pontos seguidos.';
  if (RESERVED_HANDLES.includes(h)) return 'Esse nick é reservado. Escolha outro.';
  return null;
}
