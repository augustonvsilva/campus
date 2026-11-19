import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandWatermark, Button, CampusLogo, Chip, ChipRow, CampusPicker, CommunityPicker, CoursePicker, Field, Notice, PasswordField, SemesterPicker, styles, ToggleRow } from '@/components/ui';
import { handleProblem, HANDLE_MAX, normalizeHandle, passwordProblem } from '@/lib/handle';
import { ACTIVE_COMMUNITIES } from '@/lib/community';
import { NOT_AFFILIATED } from '@/lib/legal';
import { useStore } from '@/lib/store';
import { colors } from '@/theme';

type Mode = 'signup' | 'login';

// Entrada por convite. O login pode usar qualquer e-mail (o pessoal é recomendado, pois continua
// valendo depois da formatura). O vínculo com a universidade é confirmado depois, no perfil,
// com um código enviado ao e-mail institucional.
//
// Senha: criada no cadastro e usada para entrar. No modo Supabase, o cadastro confirma o e-mail com
// um código de 6 dígitos (a senha é gravada logo depois). "Esqueci a senha" entra com código por
// e-mail e permite criar uma senha nova na mesma tela.
export default function Entrar() {
  const { actions, community, backend } = useStore();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('signup');
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [codeFor, setCodeFor] = useState<'signup' | 'reset'>('signup');
  const [invite, setInvite] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [course, setCourse] = useState('');
  const [campusChoice, setCampus] = useState('');
  const [semester, setSemester] = useState('');
  const [code, setCode] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Universidade com um campus só: já vem escolhido.
  const campus = community.campuses.some((c) => c.name === campusChoice)
    ? campusChoice : community.campuses.length === 1 ? community.campuses[0]!.name : '';

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  /** Envolve um setter de campo: ao editar, o aviso de erro anterior some. */
  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setError(null);
  };

  const emailOk = () => /^\S+@\S+\.\S+$/.test(email.trim());

  const validate = (): string | null => {
    if (!emailOk()) return 'Digite um e-mail válido.';
    if (mode === 'login') return password ? null : 'Digite sua senha.';
    if (!invite.trim()) return 'Digite o código de convite que você recebeu.';
    if (name.trim().length < 2) return 'Conta pra gente seu nome.';
    const nick = handleProblem(handle);
    if (nick) return nick;
    const pw = passwordProblem(password);
    if (pw) return pw;
    if (!campus) return 'Escolha seu campus.';
    if (course.trim().length < 2) return 'Escolha seu curso.';
    if (!semester) return 'Escolha seu semestre.';
    if (!accepted) return 'Para entrar, aceite os Termos de uso e a Política de Privacidade.';
    return null;
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setPassword('');
    setError(null);
  };

  const submit = () => {
    const problem = validate();
    if (problem) return setError(problem);
    void run(async () => {
      const needsCode = await actions.startSignIn(
        mode === 'login'
          ? { mode, email, password }
          : { mode, email, password, name, handle, course, campus, semester, inviteCode: invite },
      );
      if (needsCode) {
        setCodeFor('signup');
        setStep('code');
      }
    });
  };

  const forgot = () => {
    if (!emailOk()) return setError('Digite seu e-mail para receber o código.');
    void run(async () => {
      const needsCode = await actions.startSignIn({ mode: 'code', email });
      if (needsCode) {
        setCodeFor('reset');
        setNewPassword('');
        setStep('code');
      }
    });
  };

  const confirm = () => {
    if (!/^\d{6}$/.test(code.trim())) return setError('O código tem 6 números.');
    if (codeFor === 'reset' && newPassword) {
      const pw = passwordProblem(newPassword);
      if (pw) return setError(pw);
    }
    void run(() => actions.confirmCode(email, code, codeFor === 'reset' ? newPassword || undefined : undefined));
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BrandWatermark size={460} opacity={0.07} style={{ right: -150, top: -40 }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 32, gap: 24 }]} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 8 }}>
          <CampusLogo size={76} />
          <Text style={[styles.kicker, { marginTop: 8 }]}>{community.shortName.toUpperCase()} · ACESSO POR CONVITE</Text>
          <Text style={{ color: colors.text, fontSize: 56, fontWeight: '900', letterSpacing: -2 }}>CAMPUS</Text>
          <Text style={[styles.body, { fontSize: 18, color: colors.muted }]}>Onde a vida universitária acontece.</Text>
        </View>

        {step === 'code' ? (
          <View style={{ gap: 14 }}>
            <Text style={styles.h2}>Confira seu e-mail</Text>
            <Text style={styles.muted}>Enviamos um código de 6 números para {email.trim().toLowerCase()}.</Text>
            <Field label="Código" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" placeholder="000000" />
            {codeFor === 'reset' ? (
              <PasswordField label="Nova senha (opcional)" value={newPassword} onChangeText={edit(setNewPassword)}
                autoComplete="new-password" textContentType="newPassword" placeholder="Mínimo de 8 caracteres" />
            ) : null}
            {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
            <Button label={busy ? 'Confirmando…' : 'Entrar'} icon="arrow-forward" disabled={busy} onPress={confirm} />
            <Button label="Voltar" variant="ghost" compact onPress={() => { setStep('form'); setCode(''); setError(null); }} />
          </View>
        ) : (
          <>
            {ACTIVE_COMMUNITIES.length > 1 ? (
              <CommunityPicker value={community.id} communities={ACTIVE_COMMUNITIES}
                onChange={(id) => {
                  if (id === community.id) return;
                  // Cursos e convites mudam com a universidade.
                  setCourse('');
                  setCampus('');
                  setError(null);
                  void actions.chooseCommunity(id);
                }} />
            ) : null}
            {mode === 'signup' ? <CampusPicker value={campus} onChange={edit(setCampus)} campuses={community.campuses} /> : null}
            <ChipRow>
              <Chip label="Tenho um convite" icon="mail-open-outline" active={mode === 'signup'} onPress={() => switchMode('signup')} />
              <Chip label="Já tenho conta" icon="log-in-outline" active={mode === 'login'} onPress={() => switchMode('login')} />
            </ChipRow>

            <View style={{ gap: 14 }}>
              {mode === 'signup' ? (
                <>
                  <Field label="Código de convite" value={invite} onChangeText={edit(setInvite)} autoCapitalize="characters" placeholder={`Ex.: ${community.invitePrefix}-7KQ2P`} />
                  <Field label="Seu nome" value={name} onChangeText={edit(setName)} placeholder="Como você quer aparecer" autoComplete="name" />
                  <Field
                    label="Nome de usuário"
                    value={handle}
                    onChangeText={edit((v: string) => setHandle(normalizeHandle(v).slice(0, HANDLE_MAX)))}
                    placeholder="ex.: ana.ribeiro"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    hint={handle.length >= 3 ? handleProblem(handle) ?? undefined : undefined}
                  />
                </>
              ) : null}
              <Field
                label="E-mail"
                value={email}
                onChangeText={edit(setEmail)}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <PasswordField
                label="Senha"
                value={password}
                onChangeText={edit(setPassword)}
                placeholder={mode === 'signup' ? 'Mínimo de 8 caracteres' : 'Sua senha'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                onSubmitEditing={mode === 'login' ? submit : undefined}
              />
              {mode === 'signup' ? (
                <>
                  <CoursePicker value={course} onChange={edit(setCourse)} courses={community.courses} />
                  <SemesterPicker value={semester} onChange={edit(setSemester)} />
                  <ToggleRow
                    label="Li e aceito os Termos de uso e a Política de Privacidade"
                    hint="Respeito, nada de assédio, discriminação ou exposição de terceiros. Conteúdo pode ser denunciado e removido."
                    value={accepted}
                    onValueChange={edit(setAccepted)}
                  />
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <Text style={[styles.label, { color: colors.accentSoft }]} accessibilityRole="link" onPress={() => router.push('/termos')}>Termos de uso</Text>
                    <Text style={[styles.label, { color: colors.accentSoft }]} accessibilityRole="link" onPress={() => router.push('/privacidade')}>Política de Privacidade</Text>
                  </View>
                </>
              ) : null}
            </View>

            {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}

            <Button
              label={busy ? 'Enviando…' : mode === 'signup' && backend === 'supabase' ? 'Receber código por e-mail' : 'Entrar no Campus'}
              icon="arrow-forward" disabled={busy} onPress={submit}
            />
            {mode === 'login' ? (
              <Button label="Esqueci a senha (entrar com código)" variant="ghost" compact disabled={busy} onPress={forgot} />
            ) : null}

            {backend === 'demo' ? (
              <Text style={[styles.hint, { textAlign: 'center' }]}>
                Modo demonstração: os dados ficam só neste aparelho.{'\n'}
                Convites: {community.inviteCodes[0]} (membro) ou FUNDADORES (admin, com acesso à moderação).
              </Text>
            ) : null}
            <Text style={[styles.hint, { textAlign: 'center' }]}>{NOT_AFFILIATED}</Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
