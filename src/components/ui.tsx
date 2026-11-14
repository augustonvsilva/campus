import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  Image, Pressable, StyleProp, StyleSheet, Switch, Text, TextInput, TextInputProps, View, ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { User } from '@/lib/types';
import { useMe, useStore } from '@/lib/store';
import { colors, radius } from '@/theme';

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
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface2 }}
      />
    );
  }
  return (
    <View
      accessibilityLabel={user ? `Foto de ${user.name}` : undefined}
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: user?.color ?? colors.surface2,
        alignItems: 'center', justifyContent: 'center',
      }}>
      <Text style={{ color: colors.onAccent, fontWeight: '800', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export function TabHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const { me, community } = useStore();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>CAMPUS · {community.shortName.toUpperCase()}</Text>
        <Text style={styles.h1}>{title}</Text>
        {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
      </View>
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
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        variant === 'danger' && { borderWidth: 1, borderColor: colors.danger },
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={compact ? 16 : 18} color={fg} /> : null}
      {label ? <Text style={[styles.buttonText, { color: fg }, compact && { fontSize: 14 }]}>{label}</Text> : null}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
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
    <View style={[styles.badge, { borderColor: color }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={color} /> : null}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function Card({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>
      {children}
    </Pressable>
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        style={[styles.input, props.multiline && { minHeight: 96, textAlignVertical: 'top' }, props.style]}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
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
      <Ionicons name={icon} size={28} color={colors.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {text ? <Text style={[styles.muted, { textAlign: 'center' }]}>{text}</Text> : null}
    </View>
  );
}

export function Notice({ icon = 'information-circle', text, tone = 'muted' }: { icon?: IconName; text: string; tone?: 'muted' | 'warn' }) {
  const color = tone === 'warn' ? colors.warn : colors.muted;
  return (
    <View style={[styles.notice, { borderColor: tone === 'warn' ? colors.warn : colors.border }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.hint, { flex: 1, color: tone === 'warn' ? colors.text : colors.muted }]}>{text}</Text>
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
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.bg },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  h1: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  h2: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
  muted: { color: colors.muted, fontSize: 13 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700' },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, paddingHorizontal: 18, borderRadius: radius.pill,
  },
  buttonText: { fontSize: 15, fontWeight: '800' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    color: colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  empty: { alignItems: 'center', gap: 6, padding: 24, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  notice: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
});
