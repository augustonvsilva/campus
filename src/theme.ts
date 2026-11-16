// Identidade "urbano e editorial", versão robusta: grafite profundo, bordas marcadas,
// sombras duras deslocadas (estilo pôster/neo-brutalista) e um destaque verde-limão vibrante.
export const colors = {
  bg: '#0D0F14',
  surface: '#181B23',
  surface2: '#232733',
  border: '#343A49',
  /** Contorno escuro das peças "em relevo" (botões, cards, selos ativos). */
  ink: '#05060A',
  text: '#F5F3EE',
  muted: '#9AA0AE',
  accent: '#C8F25A',
  /** Verde mais escuro, para bordas e textos sobre fundo claro. */
  accentDeep: '#7FA51F',
  onAccent: '#0D0F14',
  danger: '#FF6B6B',
  warn: '#FFC857',
  info: '#7FD8FF',
} as const;

export const radius = { sm: 6, md: 10, lg: 14, pill: 999 } as const;

/** Sombra dura deslocada (sem desfoque): dá peso e profundidade às peças. */
export const hardShadow = (offset = 4, color: string = colors.ink) => ({ boxShadow: `${offset}px ${offset}px 0px ${color}` });

/** Cores de avatar (fundo), legíveis com texto escuro. */
export const avatarColors = ['#C8F25A', '#7FD8FF', '#FFB86B', '#FF8FB1', '#B69CFF', '#6EE7B7', '#FDE047'];
