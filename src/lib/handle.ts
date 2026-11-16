// Regras do nome de usuário (@handle), do semestre e da senha, compartilhadas por cadastro e perfil.
// As mesmas regras valem no banco (migration 0006), que é quem garante a unicidade.

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;

/** Nomes de usuário que poderiam confundir com contas oficiais ou rotas do app. */
export const RESERVED_HANDLES = [
  'admin', 'administrador', 'campus', 'equipe', 'moderacao', 'moderador', 'suporte', 'oficial',
  'mackenzie', 'mackenzista', 'puc', 'pucsp', 'universidade', 'visitante',
];

export const SEMESTERS = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º', '11º', '12º'];

/** Minúsculas, sem @ inicial e sem espaços nas pontas. */
export function normalizeHandle(raw: string) {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

/** Mensagem explicando o problema do nome de usuário, ou null se o formato é válido (não checa se está livre). */
export function handleProblem(raw: string): string | null {
  const h = normalizeHandle(raw);
  if (h.length < HANDLE_MIN) return `O nome de usuário precisa ter pelo menos ${HANDLE_MIN} caracteres.`;
  if (h.length > HANDLE_MAX) return `O nome de usuário pode ter no máximo ${HANDLE_MAX} caracteres.`;
  if (!/^[a-z0-9._]+$/.test(h)) return 'Use só letras sem acento, números, ponto ou _ no nome de usuário.';
  if (h.startsWith('.') || h.endsWith('.') || h.includes('..')) return 'O nome de usuário não pode começar ou terminar com ponto, nem ter dois pontos seguidos.';
  if (RESERVED_HANDLES.includes(h)) return 'Esse nome de usuário é reservado. Escolha outro.';
  return null;
}

// ── Senha ──
export const PASSWORD_MIN = 8;

/** Mensagem explicando o problema da senha, ou null se ela é aceitável. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`;
  if (password.length > 72) return 'A senha pode ter no máximo 72 caracteres.';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return 'Use letras e números na senha.';
  return null;
}
