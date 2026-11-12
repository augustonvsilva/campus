import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, ChipRow, Field, Notice, styles, ToggleRow } from '@/components/ui';
import { isInstitutionalEmail } from '@/lib/community';
import { useStore } from '@/lib/store';
import { colors } from '@/theme';

type Mode = 'signup' | 'login';

// Entrada por convite + validação de vínculo (e-mail institucional ou verificação alternativa).
// No modo Supabase, o acesso é confirmado com um código de 6 dígitos enviado por e-mail.
export default function Entrar() {
  const { actions, community, backend } = useStore();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('signup');
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [invite, setInvite] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');
  const [code, setCode] = useState('');
  const [noInstitutional, setNoInstitutional] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const validate = (): string | null => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Digite um e-mail válido.';
    if (mode === 'login') return null;
    if (!invite.trim()) return 'Digite o código de convite que você recebeu.';
    if (name.trim().length < 2) return 'Conta pra gente seu nome.';
    if (!noInstitutional && !isInstitutionalEmail(email)) {
      return `Use seu e-mail institucional (@${community.emailDomains[0]}) ou ative a verificação alternativa.`;
    }
    if (!accepted) return 'Para entrar, aceite as regras da comunidade.';
    return null;
  };

  const submit = () => {
    const problem = validate();
    if (problem) return setError(problem);
    void run(async () => {
      const needsCode = await actions.startSignIn(
        mode === 'login'
          ? { mode, email }
          : { mode, email, name, course, inviteCode: invite, alternativeVerification: noInstitutional },
      );
      if (needsCode) setStep('code');
    });
  };

  const confirm = () => {
    if (!/^\d{6}$/.test(code.trim())) return setError('O código tem 6 números.');
    void run(() => actions.confirmCode(email, code));
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 32, gap: 24 }]} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 8 }}>
          <Text style={styles.kicker}>{community.shortName.toUpperCase()} · ACESSO POR CONVITE</Text>
          <Text style={{ color: colors.text, fontSize: 56, fontWeight: '900', letterSpacing: -2 }}>CAMPUS</Text>
          <Text style={[styles.body, { fontSize: 18, color: colors.muted }]}>Onde a vida universitária acontece.</Text>
        </View>

        {step === 'code' ? (
          <View style={{ gap: 14 }}>
            <Text style={styles.h2}>Confira seu e-mail</Text>
            <Text style={styles.muted}>Enviamos um código de 6 números para {email.trim().toLowerCase()}.</Text>
            <Field label="Código" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" placeholder="000000" />
            {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
            <Button label={busy ? 'Confirmando…' : 'Entrar'} icon="arrow-forward" disabled={busy} onPress={confirm} />
            <Button label="Usar outro e-mail" variant="ghost" compact onPress={() => { setStep('form'); setCode(''); setError(null); }} />
          </View>
        ) : (
          <>
            <ChipRow>
              <Chip label="Tenho um convite" icon="mail-open-outline" active={mode === 'signup'} onPress={() => { setMode('signup'); setError(null); }} />
              <Chip label="Já tenho conta" icon="log-in-outline" active={mode === 'login'} onPress={() => { setMode('login'); setError(null); }} />
            </ChipRow>

            <View style={{ gap: 14 }}>
              {mode === 'signup' ? (
                <>
                  <Field label="Código de convite" value={invite} onChangeText={setInvite} autoCapitalize="characters" placeholder="Ex.: MACK-7KQ2P" />
                  <Field label="Seu nome" value={name} onChangeText={setName} placeholder="Como você quer aparecer" autoComplete="name" />
                </>
              ) : null}
              <Field
                label={mode === 'signup' && !noInstitutional ? 'E-mail institucional' : 'E-mail'}
                value={email}
                onChangeText={setEmail}
                placeholder={mode === 'signup' && !noInstitutional ? `voce@${community.emailDomains[0]}` : 'seu@email.com'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {mode === 'signup' ? (
                <>
                  <Field label="Curso (opcional)" value={course} onChangeText={setCourse} placeholder="Ex.: Engenharia Civil" />
                  <ToggleRow
                    label="Não tenho acesso ao e-mail institucional"
                    hint="Você entra, mas sua conta fica em análise até a equipe confirmar seu vínculo — dá para enviar um comprovante de matrícula pelo perfil. Até lá, você só pode ver o conteúdo."
                    value={noInstitutional}
                    onValueChange={setNoInstitutional}
                  />
                  <ToggleRow
                    label="Li e aceito as regras da comunidade"
                    hint="Respeito, nada de assédio, discriminação ou exposição de terceiros. Conteúdo pode ser denunciado e removido."
                    value={accepted}
                    onValueChange={setAccepted}
                  />
                </>
              ) : null}
            </View>

            {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}

            <Button
              label={busy ? 'Enviando…' : backend === 'supabase' ? 'Receber código por e-mail' : 'Entrar no Campus'}
              icon="arrow-forward" disabled={busy} onPress={submit}
            />

            {backend === 'demo' ? (
              <Text style={[styles.hint, { textAlign: 'center' }]}>
                Modo demonstração: os dados ficam só neste aparelho.{'\n'}
                Convites: MACK2026 (membro) ou FUNDADORES (admin, com acesso à moderação).
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
