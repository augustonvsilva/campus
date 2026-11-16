// Identidade Campus: noite roxa. Fundo quase preto com toque violeta, superfícies em camadas,
// destaque violeta vibrante e brilhos suaves.
export const colors = {
  bg: '#0B0911',
  surface: '#15121E',
  surface2: '#201B2C',
  border: '#2D2640',
  /** Contorno escuro (avatares, peças sobre fundo claro). */
  ink: '#07060B',
  text: '#F4F1FA',
  muted: '#A39CB4',
  accent: '#8B5CF6',
  /** Violeta mais claro, para textos e ícones de destaque sobre fundo escuro. */
  accentSoft: '#B79CFF',
  accentDeep: '#6D28D9',
  /** Texto sobre o destaque. */
  onAccent: '#FFFFFF',
  danger: '#FF5C7A',
  warn: '#FFC857',
  info: '#7FD8FF',
  online: '#3DDC84',
} as const;

export const radius = { sm: 8, md: 14, lg: 18, pill: 999 } as const;

/** Sombra suave (profundidade). O nome ficou da versão anterior para não mexer em todas as telas. */
export const hardShadow = (offset = 4) => ({ boxShadow: `0px ${offset}px ${offset * 5}px rgba(0, 0, 0, 0.45)` });

/** Brilho violeta em volta da peça (botões e itens ativos). */
export const glow = (strength = 1) => ({ boxShadow: `0px 0px ${18 * strength}px rgba(139, 92, 246, ${0.45 * strength})` });

/** Cores de avatar (fundo), legíveis com texto escuro. */
export const avatarColors = ['#C8F25A', '#7FD8FF', '#FFB86B', '#FF8FB1', '#B69CFF', '#6EE7B7', '#FDE047'];
