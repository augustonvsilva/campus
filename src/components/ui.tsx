import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import {
  Image, Platform, Pressable, StyleProp, StyleSheet, Switch, Text, TextInput, TextInputProps, useWindowDimensions, View, ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SEMESTERS } from '@/lib/handle';
import type { User } from '@/lib/types';
import { useMe, useStore } from '@/lib/store';
import { colors, glow, hardShadow, onThemeChange, radius, themeMode } from '@/theme';

const LOGO = require('../../assets/brand/logo.png');
const LOGO_LIGHT = require('../../assets/brand/logo-light.png');

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Avatar({ user, size = 36 }: { user?: User; size?: number }) {
  const initials = user
    ? user.name.split(' ').filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('')
    : '?';
  if (user?.avatarUrl) {
    return (
      <Image
        source={{ uri: user.avatarUrl }}
        accessibilityLabel={`Foto de ${user.name}`}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface2, borderWidth: 2, borderColor: colors.surface2 }}
      />
    );
  }
  return (
    <View
      accessibilityLabel={user ? `Foto de ${user.name}` : undefined}
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: user?.color ?? colors.surface2,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)',
      }}>
      <Text style={{ color: '#14111C', fontWeight: '900', fontSize: size * 0.36, letterSpacing: -0.5 }}>{initials}</Text>
    </View>
  );
}

/** Tela larga (computador): menu lateral + colunas. Abaixo disso, layout de celular. */
export const WIDE = 1000;
export function useWide() {
  return useWindowDimensions().width >= WIDE;
}

/** Símbolo do Campus (hexágono vermelho e branco). No tema claro, as partes brancas viram grafite. */
export function CampusLogo({ size = 44 }: { size?: number }) {
  return (
    <Image source={themeMode() === 'light' ? LOGO_LIGHT : LOGO} accessibilityLabel="Campus"
      style={{ width: size, height: size }} resizeMode="contain" />
  );
}

/** Logo grande e bem apagado, ao fundo (decoração; não recebe toques). */
export function BrandWatermark({ size = 520, opacity = 0.06, style }: { size?: number; opacity?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, opacity }, style]}>
      <Image source={themeMode() === 'light' ? LOGO_LIGHT : LOGO} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );
}

/** Sombra no texto que fica sobre a foto do campus, para ler bem em qualquer parte da imagem. */
const textOnPhoto = () => ({ textShadowColor: themeMode() === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } });

/** Foto do campus como capa do topo das abas, atenuada para o título continuar legível. */
function CoverPhoto() {
  const { community } = useStore();
  const wide = useWide();
  const cover = community.cover;
  if (!cover) return null;
  return (
    <>
      <Image source={(wide && themeMode() === 'light' && cover.sourceWideLight) || (wide && cover.sourceWide) || cover.source} resizeMode="cover" accessibilityIgnoresInvertColors
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, opacity: themeMode() === 'light' ? 0.42 : 0.32 }} />
    </>
  );
}

/**
 * Topo das abas. Celular: fixo, com logo e atalhos (use sem `scrolling`).
 * Computador: capa que rola junto com o conteúdo (use com `scrolling`, dentro da lista),
 * para os posts ganharem a tela ao descer. Cada tela coloca os dois; só um aparece.
 */
export function TabHeader({ title, subtitle, scrolling }: { title: string; subtitle?: string; scrolling?: boolean }) {
  const insets = useSafeAreaInsets();
  const { me, community, unreadActivity, unreadMessages, messagesEnabled } = useStore();
  const wide = useWide();
  const cover = community.cover;
  if (wide !== !!scrolling) return null;
  if (wide) {
    return (
      <View style={[styles.header, { paddingTop: 8, paddingHorizontal: 4, borderBottomWidth: 0, backgroundColor: 'transparent' },
        cover && { overflow: 'hidden', borderRadius: radius.lg, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 18 }]}>
        <CoverPhoto />
        <View style={{ flex: 1 }}>
          {cover ? <Text style={[styles.kicker, { fontSize: 14 }, textOnPhoto()]} numberOfLines={1}>{community.shortName}</Text> : null}
          <Text style={[styles.h1, cover && textOnPhoto()]}>{title}</Text>
          {subtitle ? <Text style={[styles.muted, cover && textOnPhoto()]}>{subtitle}</Text> : null}
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12, overflow: 'hidden' }, cover && { paddingTop: insets.top + 30, paddingBottom: 28 }]}>
      <CoverPhoto />
      <View style={[styles.row, { flex: 1, gap: 12 }]}>
        <CampusLogo size={42} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, cover && textOnPhoto()]} numberOfLines={1}>{community.shortName}</Text>
          <Text style={[styles.h1, { fontSize: 28, lineHeight: 32 }, cover && textOnPhoto()]}>{title}</Text>
          {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
        </View>
      </View>
      <Pressable onPress={() => router.push('/buscar')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Buscar"
        style={styles.headerIcon}>
        <Ionicons name="search" size={22} color={colors.text} />
      </Pressable>
      {messagesEnabled ? (
        <Pressable onPress={() => router.push('/mensagens')} hitSlop={8} accessibilityRole="button"
          accessibilityLabel={unreadMessages ? `Mensagens, ${unreadMessages} não lidas` : 'Mensagens'} style={styles.headerIcon}>
          <Ionicons name={unreadMessages ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={colors.text} />
          {unreadMessages ? (
            <View style={styles.badgeDot}>
              <Text style={styles.badgeDotText}>{unreadMessages > 9 ? '9+' : unreadMessages}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
      <Pressable onPress={() => router.push('/atividade')} hitSlop={8} accessibilityRole="button"
        accessibilityLabel={unreadActivity ? `Atividade, ${unreadActivity} novidades` : 'Atividade'} style={styles.headerIcon}>
        <Ionicons name={unreadActivity ? 'notifications' : 'notifications-outline'} size={22} color={colors.text} />
        {unreadActivity ? (
          <View style={styles.badgeDot}>
            <Text style={styles.badgeDotText}>{unreadActivity > 9 ? '9+' : unreadActivity}</Text>
          </View>
        ) : null}
      </Pressable>
      <Link href="/perfil" asChild>
        <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Abrir perfil">
          <Avatar user={me} size={40} />
        </Pressable>
      </Link>
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label, onPress, variant = 'primary', icon, disabled, style, compact, accessibilityLabel,
}: {
  label: string; onPress?: () => void; variant?: ButtonVariant; icon?: IconName;
  disabled?: boolean; style?: StyleProp<ViewStyle>; compact?: boolean;
  /** Obrigatório na prática para botões só com ícone (label vazio). */
  accessibilityLabel?: string;
}) {
  const bg = { primary: colors.accent, secondary: colors.surface2, ghost: 'transparent', danger: 'transparent' }[variant];
  const fg = { primary: colors.onAccent, secondary: colors.text, ghost: colors.text, danger: colors.danger }[variant];
  const border = { primary: colors.accent, secondary: colors.border, ghost: 'transparent', danger: colors.danger }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        compact && { paddingVertical: 8, paddingHorizontal: 14 },
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        variant === 'primary' && !disabled && glow(pressed ? 0.4 : 0.8),
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={compact ? 16 : 18} color={fg} /> : null}
      {label ? <Text style={[styles.buttonText, { color: fg }, compact && { fontSize: 13 }]}>{label}</Text> : null}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && { backgroundColor: colors.accent, borderColor: colors.accent, ...glow(0.6) }]}>
      {icon ? <Ionicons name={icon} size={14} color={active ? colors.onAccent : colors.muted} /> : null}
      <Text style={[styles.chipText, active && { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

export function Badge({ label, tone = 'muted', icon, style }: {
  label: string; tone?: 'muted' | 'accent' | 'warn'; icon?: IconName; style?: StyleProp<ViewStyle>;
}) {
  const color = { muted: colors.muted, accent: colors.accentSoft, warn: colors.warn }[tone];
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}1F` }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={color} /> : null}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function Card({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}>
      {children}
    </Pressable>
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.sectionHeader}>
        <View style={[styles.row, { gap: 8, flex: 1 }]}>
          <View style={styles.sectionBar} />
          <Text style={[styles.sectionTitle, { flex: 1 }]}>{title}</Text>
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        style={[styles.input, props.multiline && { minHeight: 96, textAlignVertical: 'top' }, props.style]}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

/** Campo de senha com botão de olho para mostrar ou esconder o que foi digitado. */
export function PasswordField({ label, hint, ...props }: Omit<TextInputProps, 'secureTextEntry'> & { label: string; hint?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={{ justifyContent: 'center' }}>
        <TextInput
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
          secureTextEntry={!visible}
          style={[styles.input, { paddingRight: 48 }, props.style]}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Esconder senha' : 'Mostrar senha'}
          hitSlop={8}
          style={{ position: 'absolute', right: 6, padding: 8 }}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
        </Pressable>
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

/** Escolha do semestre em chips (1º a 12º). */
export function SemesterPicker({ value, onChange, label = 'Semestre' }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ChipRow>
        {SEMESTERS.map((s) => <Chip key={s} label={s} active={value === s} onPress={() => onChange(s)} />)}
      </ChipRow>
    </View>
  );
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Escolha do curso numa lista com busca. "Outro curso" abre um campo livre
 * (para cursos que ainda não estão na lista). Valor fora da lista = "Outro".
 */
export function CoursePicker({ value, onChange, courses }: { value: string; onChange: (v: string) => void; courses: string[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [other, setOther] = useState(!!value && !courses.includes(value));
  const filtered = courses.filter((c) => fold(c).includes(fold(query.trim())));

  const choose = (course: string | null) => {
    setOther(course === null);
    onChange(course ?? '');
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>Curso</Text>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel="Escolher curso"
        accessibilityState={{ expanded: open }}
        style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <Text style={{ color: other || value ? colors.text : colors.muted, fontSize: 15, flex: 1 }}>
          {other ? 'Outro curso' : value || 'Escolha seu curso'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>
      {open ? (
        <View style={{ borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, padding: 8, gap: 2, ...hardShadow(4) }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar curso"
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            style={[styles.input, { marginBottom: 4 }]}
          />
          {filtered.map((c) => (
            <Pressable key={c} onPress={() => choose(c)} accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: radius.sm }}>
              <Text style={{ color: colors.text, fontSize: 15, flex: 1 }}>{c}</Text>
              {c === value && !other ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : null}
            </Pressable>
          ))}
          {!filtered.length ? <Text style={[styles.hint, { padding: 8 }]}>Nenhum curso encontrado.</Text> : null}
          <Pressable onPress={() => choose(null)} accessibilityRole="button"
            style={{ paddingVertical: 10, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 }}>
            <Text style={{ color: colors.accentSoft, fontSize: 15, fontWeight: '700' }}>Outro curso (digitar)</Text>
          </Pressable>
        </View>
      ) : null}
      {other && !open ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Digite o nome do seu curso"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
      ) : null}
    </View>
  );
}

export function ToggleRow({ label, hint, value, onValueChange }: {
  label: string; hint?: string; value: boolean; onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.body}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent, false: colors.surface2 }}
        thumbColor={colors.text}
      />
    </View>
  );
}

export function Empty({ icon, title, text }: { icon: IconName; title: string; text?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Ionicons name={icon} size={26} color={colors.accentSoft} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {text ? <Text style={[styles.muted, { textAlign: 'center' }]}>{text}</Text> : null}
    </View>
  );
}

export function Notice({ icon = 'information-circle', text, tone = 'muted' }: { icon?: IconName; text: string; tone?: 'muted' | 'warn' }) {
  const color = tone === 'warn' ? colors.warn : colors.accentSoft;
  return (
    <View style={[styles.notice, { borderColor: tone === 'warn' ? colors.warn : colors.border, borderLeftColor: color, backgroundColor: `${color}12` }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.hint, { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 }]}>{text}</Text>
    </View>
  );
}

/** Aviso para quem ainda não verificou o vínculo, com atalho para a verificação no perfil. */
export function VerifyPrompt({ text }: { text: string }) {
  const { verificationRequests } = useStore();
  const me = useMe();
  const inReview = me.verification === 'pending' && verificationRequests.some((v) => v.userId === me.id && v.evidence);
  return (
    <View style={{ gap: 10 }}>
      <Notice tone="warn" icon={inReview ? 'hourglass-outline' : 'shield-outline'}
        text={inReview ? 'Seu comprovante está em análise. Se preferir não esperar, confirme pelo e-mail institucional.' : text} />
      <Button label="Verificar vínculo" icon="shield-checkmark" compact onPress={() => router.push('/perfil')} />
    </View>
  );
}

/** Estilos montados a partir da paleta ativa (refeitos quando o tema muda). */
const makeStyles = () => StyleSheet.create({
  headerIcon: {
    width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginRight: 6,
    borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  badgeDot: {
    position: 'absolute', top: -4, right: -4, minWidth: 19, height: 19, borderRadius: 10, paddingHorizontal: 4,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg,
  },
  badgeDotText: { color: colors.onAccent, fontSize: 10, fontWeight: '900' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, backgroundColor: colors.glass,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tag: { alignSelf: 'flex-start', backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 6 },
  tagText: { color: colors.onAccent, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  kicker: { color: colors.accentSoft, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  h1: { color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 36 },
  h2: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  title: { color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800' },
  /** Rótulo de campo de formulário. */
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, paddingHorizontal: 20, borderRadius: radius.pill, borderWidth: 1,
  },
  buttonText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.1 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: radius.pill,
    paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  card: {
    backgroundColor: colors.cardBg, borderRadius: radius.lg, padding: 18, gap: 12,
    borderWidth: 1, borderColor: colors.border, ...hardShadow(3),
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.995 }] },
  /** Faixa violeta à esquerda (publicações). */
  cardStripe: { borderLeftWidth: 3, borderLeftColor: colors.accent },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionBar: { width: 4, height: 18, borderRadius: 2, backgroundColor: colors.accent },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  input: {
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    color: colors.text, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  empty: {
    alignItems: 'center', gap: 8, padding: 24, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    borderStyle: 'dashed', backgroundColor: colors.surface,
  },
  emptyIcon: {
    width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  notice: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, borderLeftWidth: 4, alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // No navegador a tela é transparente (o fundo com o logo aparece atrás dos cartões);
  // no app nativo fica opaca, para as telas não se sobreporem nas transições.
  screen: { flex: 1, backgroundColor: Platform.OS === 'web' ? 'transparent' : colors.bg },
  content: { padding: 16, gap: 16, paddingBottom: 96 },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, gap: 4 },
  bubbleMine: { backgroundColor: colors.accent, borderBottomRightRadius: 6, ...glow(0.4) },
  bubbleTheirs: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 6 },
});

export const styles = makeStyles();
onThemeChange(() => Object.assign(styles, makeStyles()));
