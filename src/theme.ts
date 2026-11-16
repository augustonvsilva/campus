// Identidade Campus: as cores do logo (vermelho e branco) sobre grafite, com tema escuro e claro.
//
// Como o tema troca sem reescrever as telas: `colors` é um objeto mutável. applyTheme() copia a
// paleta escolhida para dentro dele e avisa quem montou estilos (ui.tsx refaz o `styles`); o layout
// raiz então remonta a árvore (chave do tema), e tudo é desenhado de novo com as cores novas.
import { Appearance } from 'react-native';

export type ThemeMode = 'dark' | 'light';
export type ThemePreference = ThemeMode | 'system';

const dark = {
  bg: '#0A0A0D',
  surface: '#141418',
  surface2: '#1E1E25',
  border: '#2A2A33',
  ink: '#000000',
  text: '#F5F5F7',
  muted: '#A1A1AA',
  accent: '#F0192F',
  /** Destaque para textos e ícones (contraste melhor sobre o fundo). */
  accentSoft: '#FF5A6B',
  accentDeep: '#B10E21',
  onAccent: '#FFFFFF',
  danger: '#FF6B57',
  warn: '#FFC857',
  info: '#7FD8FF',
  online: '#34D399',
  /** Fundos translúcidos (menu lateral, barra de abas). */
  glass: 'rgba(14,14,18,0.86)',
  /** Fundo dos cartões: um pouco transparente, deixa ver o logo do fundo. */
  cardBg: 'rgba(22,22,27,0.6)',
  /** Item ativo do menu. */
  navActiveBg: 'rgba(240,25,47,0.14)',
  navActiveBorder: 'rgba(240,25,47,0.45)',
  navText: '#D4D4DA',
  /** Cartão de convite do menu. */
  inviteBg: '#1A0E12',
  /** Fundo fora da coluna central (tablet). */
  wideBg: '#050507',
  /** Faixa do resultado de enquete votado. */
  pollFill: 'rgba(240,25,47,0.22)',
  /** Texto secundário dentro do balão da própria mensagem. */
  onAccentMuted: 'rgba(255,255,255,0.78)',
  /** RGB do destaque e da sombra, para brilhos/sombras com transparência. */
  glowRgb: '240,25,47',
  shadow: 'rgba(0,0,0,0.5)',
};

const light: typeof dark = {
  bg: '#F4F4F6',
  surface: '#FFFFFF',
  surface2: '#F0F0F3',
  border: '#E3E3E8',
  ink: '#111114',
  text: '#141417',
  muted: '#6B6B76',
  accent: '#E3132A',
  accentSoft: '#C8102A',
  accentDeep: '#A50D1F',
  onAccent: '#FFFFFF',
  danger: '#D4351C',
  warn: '#A86A00',
  info: '#0B79A8',
  online: '#16A34A',
  glass: 'rgba(255,255,255,0.88)',
  cardBg: 'rgba(255,255,255,0.66)',
  navActiveBg: 'rgba(227,19,42,0.09)',
  navActiveBorder: 'rgba(227,19,42,0.32)',
  navText: '#3A3A44',
  inviteBg: '#FFF1F2',
  wideBg: '#E9E9EE',
  pollFill: 'rgba(227,19,42,0.14)',
  onAccentMuted: 'rgba(255,255,255,0.85)',
  glowRgb: '227,19,42',
  shadow: 'rgba(20,20,30,0.10)',
};

export type Palette = typeof dark;

/** Paleta ativa (mutável: muda em applyTheme). */
export const colors: Palette = { ...dark };

let current: ThemeMode = 'dark';
export const themeMode = () => current;

const listeners = new Set<() => void>();
/** Quem monta estilos a partir de `colors` se inscreve aqui para refazê-los quando o tema muda. */
export function onThemeChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resolveTheme(pref: ThemePreference): ThemeMode {
  return pref === 'system' ? (Appearance.getColorScheme() === 'light' ? 'light' : 'dark') : pref;
}

export function applyTheme(mode: ThemeMode) {
  if (mode === current) return;
  current = mode;
  Object.assign(colors, mode === 'light' ? light : dark);
  listeners.forEach((fn) => fn());
}

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;

/** Sombra suave de profundidade (o nome ficou de uma versão anterior). */
export const hardShadow = (offset = 4) => ({ boxShadow: `0px ${offset}px ${offset * 6}px ${colors.shadow}` });

/** Brilho do destaque em volta da peça (botões e itens ativos). */
export const glow = (strength = 1) => ({
  boxShadow: `0px ${4 * strength}px ${18 * strength}px rgba(${colors.glowRgb}, ${(current === 'light' ? 0.28 : 0.45) * strength})`,
});

/** Cores de avatar (fundo), legíveis com texto escuro. */
export const avatarColors = ['#C8F25A', '#7FD8FF', '#FFB86B', '#FF8FB1', '#B69CFF', '#6EE7B7', '#FDE047'];
