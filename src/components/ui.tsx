import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import {
  Image, Pressable, StyleProp, StyleSheet, Switch, Text, TextInput, TextInputProps, View, ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SEMESTERS } from '@/lib/handle';
import type { User } from '@/lib/types';
import { useMe, useStore } from '@/lib/store';
import { colors, hardShadow, radius } from '@/theme';

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
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface2, borderWidth: 2, borderColor: colors.ink }}
      />
    );
  }
  return (
    <View
      accessibilityLabel={user ? `Foto de ${user.name}` : undefined}
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: user?.color ?? colors.surface2,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.ink,
      }}>
      <Text style={{ color: colors.onAccent, fontWeight: '900', fontSize: size * 0.36, letterSpacing: -0.5 }}>{initials}</Text>
    </View>
  );
}

export function TabHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const { me, community, unreadActivity, unreadMessages, messagesEnabled } = useStore();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.tag}><Text style={styles.tagText}>CAMPUS · {community.shortName.toUpperCase()}</Text></View>
        <Text style={styles.h1}>{title}</Text>
        {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
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
  const border = { primary: colors.ink, secondary: colors.border, ghost: 'transparent', danger: colors.danger }[variant];
  const raised = variant === 'primary' || variant === 'secondary';
  const depth = compact ? 3 : 4;
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
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.45 : 1 },
        raised && !disabled && (pressed
          ? { transform: [{ translateX: depth - 1 }, { translateY: depth - 1 }], ...hardShadow(1) }
          : hardShadow(depth)),
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
      style={[styles.chip, active && { backgroundColor: colors.accent, borderColor: colors.ink, ...hardShadow(2) }]}>
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
  const color = { muted: colors.muted, accent: colors.accent, warn: colors.warn }[tone];
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}1F` }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={color} /> : null}
      <Text style={[styles.badgeText, { color }]}>{label.toUpperCase()}</Text>
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
            <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '700' }}>Outro curso (digitar)</Text>
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
      <View style={styles.emptyIcon}><Ionicons name={icon} size={26} color={colors.accent} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {text ? <Text style={[styles.muted, { textAlign: 'center' }]}>{text}</Text> : null}
    </View>
  );
}

export function Notice({ icon = 'information-circle', text, tone = 'muted' }: { icon?: IconName; text: string; tone?: 'muted' | 'warn' }) {
  const color = tone === 'warn' ? colors.warn : colors.info;
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

export const styles = StyleSheet.create({
  headerIcon: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 6,
    borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
  },
  badgeDot: {
    position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 4,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.ink,
  },
  badgeDotText: { color: colors.onAccent, fontSize: 10, fontWeight: '900' },
  header: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 14, backgroundColor: colors.bg,
    borderBottomWidth: 2, borderBottomColor: colors.border,
  },
  tag: { alignSelf: 'flex-start', backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, marginBottom: 6 },
  tagText: { color: colors.onAccent, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },
  h1: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1.2, lineHeight: 38 },
  h2: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 },
  title: { color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800' },
  /** Rótulo de campo de formulário (caixa alta). */
  fieldLabel: { color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, paddingHorizontal: 18, borderRadius: radius.md, borderWidth: 2,
  },
  buttonText: { fontSize: 15, fontWeight: '900', letterSpacing: 0.3, textTransform: 'uppercase' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: radius.sm,
    paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 12,
    borderWidth: 2, borderColor: colors.border, ...hardShadow(4),
  },
  cardPressed: { transform: [{ translateX: 3 }, { translateY: 3 }], ...hardShadow(1) },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionBar: { width: 5, height: 20, borderRadius: 2, backgroundColor: colors.accent },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '900', letterSpacing: -0.4 },
  input: {
    backgroundColor: '#12151C', borderWidth: 2, borderColor: colors.border, borderRadius: radius.md,
    color: colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  empty: {
    alignItems: 'center', gap: 8, padding: 24, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border,
    borderStyle: 'dashed', backgroundColor: colors.surface,
  },
  emptyIcon: {
    width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface2, borderWidth: 2, borderColor: colors.border,
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  notice: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1.5, borderLeftWidth: 5, alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 16, paddingBottom: 56 },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, gap: 4, borderWidth: 2 },
  bubbleMine: { backgroundColor: colors.accent, borderColor: colors.ink, borderBottomRightRadius: 4, ...hardShadow(3) },
  bubbleTheirs: { backgroundColor: colors.surface2, borderColor: colors.border, borderBottomLeftRadius: 4 },
});
