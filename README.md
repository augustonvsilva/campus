# Campus

**Onde a vida universitária acontece.** Rede social universitária da Cúpula. Lançamento: comunidade **Mackenzie**.

## Rodar

```bash
npm install
npm run web        # navegador (http://localhost:8081)
npm start          # QR code para abrir no celular com o Expo Go
```

Sem `.env.local`, o app roda no **modo demonstração**: os dados são fictícios e ficam só no aparelho.
- Convites: `MACK2026` (membro) ou `FUNDADORES` (admin, com acesso ao painel de moderação).
- Cadastro com qualquer e-mail (o pessoal é recomendado). Para publicar, o aluno confirma o vínculo no perfil com um código enviado ao e-mail institucional (`@mackenzista.com.br` ou `@mackenzie.br`). Na demo, o código aparece na tela.

Com `.env.local` preenchido (veja abaixo), o app usa o **Supabase**: login com e-mail e senha (cadastro e "Esqueci a senha" confirmam o e-mail com um código), dados compartilhados entre todos e atualização em tempo real.

## Verificações

| Comando | O que testa |
|---|---|
| `npm run typecheck` | Tipos (TypeScript) |
| `npm run lint` | ESLint |
| `npm run test:db` | Aplica as migrations num Postgres em memória e roda 177 cenários de segurança: convite, exclusão de conta, edição do próprio conteúdo, central de atividade, nome de usuário único, verificação pelo e-mail institucional, isolamento entre universidades, RLS, lotação de Bora? e saídas, comunidades e admins, moderação e storage |
| `npm run test:e2e` | 41 fluxos no Chrome headless com o modo demo (precisa do app web rodando em modo demo: sem `.env.local`, ou com `EXPO_PUBLIC_SUPABASE_URL=` vazio) |

## Colocar o Supabase no ar

1. Crie um projeto em [supabase.com](https://supabase.com). Sugestão: região **São Paulo (sa-east-1)**, pensando na LGPD.
2. Aplique o banco, por um destes caminhos:
   - **Painel:** no SQL Editor, rode em ordem `supabase/migrations/0001_init.sql`, `0002_moderacao_midia_convites.sql`, `0003_foto_perfil.sql`, `0004_conexoes_comunidades.sql`, `0005_email_institucional.sql`, `0006_nick_curso_semestre.sql`, `0007_excluir_conta.sql`, `0008_engajamento.sql`, `0009_puc_sp.sql` (PUC-SP dormindo; opcional) e, se quiser conteúdo inicial de exemplo, `supabase/seed.sql`.
   - **CLI:** `npx supabase link --project-ref <ref>` e depois `npx supabase db push`.
3. Em **Authentication → Email Templates → Magic Link**, inclua `{{ .Token }}` no texto, para o e-mail trazer o código de 6 dígitos. Exemplo: `Seu código do Campus: {{ .Token }}`.
   Em **Authentication → Providers → Email**, defina o tamanho mínimo de senha como 8 (o app já exige 8, com letras e números) e deixe *Secure password change* desligado: a troca de senha no perfil não pede a senha antiga, já que a recuperação é feita por código no e-mail.
4. Em **Authentication → SMTP**, configure um provedor próprio (Resend, SES…). O SMTP padrão do Supabase só envia poucos e-mails por hora.
5. Publique as Edge Functions (código de vínculo no e-mail institucional e exclusão de conta):
   ```bash
   npx supabase secrets set RESEND_API_KEY=re_... EMAIL_FROM="Campus <verificacao@seudominio.com.br>"
   npx supabase functions deploy verificar-vinculo
   npx supabase functions deploy excluir-conta
   ```
   O remetente precisa de domínio verificado no Resend (SPF/DKIM). Sem isso, o servidor de e-mail da universidade tende a mandar o código para o spam ou recusá-lo.
6. Copie `.env.example` para `.env.local` e preencha com URL e *publishable key* (Project Settings → API). **Nunca** use a `service_role` no app.
7. Crie sua conta pelo app com o convite `FUNDADORES` (criado pela migration, com 50 usos). Depois torne-se admin no SQL Editor:
   ```sql
   update profiles set role = 'admin'
   where id = (select id from auth.users where email = 'voce@seuemail.com');
   ```
8. Antes do lançamento, troque o convite `FUNDADORES` por códigos da equipe e dos embaixadores:
   `insert into invites (code, community_id, max_uses) values ('EMBAIXADOR-ANA', 'mackenzie', 30);`

## O que já existe (v0.2)

| Área | Status |
|---|---|
| Convite + login com e-mail (pessoal ou institucional) e senha; cadastro confirma o e-mail por código | ✅ |
| Boas-vindas no primeiro acesso: interesses, comunidades para entrar e pessoas para seguir | ✅ |
| Central de atividade (sino com contador): seguiu, curtiu, comentou, respondeu, entrou no Bora?, reservou, entrou na comunidade | ✅ |
| Busca por pessoas (@usuário), comunidades, eventos, Bora?, lugares e publicações | ✅ |
| Editar e apagar a própria publicação e os próprios comentários (marcados como "editado") | ✅ |
| Compartilhar link, ver no mapa, adicionar ao Google Agenda ou baixar .ics | ✅ |
| Conversa nas saídas e chave Pix com botão de copiar | ✅ |
| Site instalável (PWA: ícone na tela inicial) e prévia de link no WhatsApp/Instagram | ✅ |
| Mensagens privadas | 🧪 só no modo demonstração (ficam no aparelho; respostas automáticas das pessoas fictícias). Falta tabela + RLS no banco |
| Tema escuro, claro ou do sistema (Perfil → Aparência); logo do Campus no ícone, nos menus e ao fundo | ✅ |
| Venda de ingressos (Campus como promoter): lotes, Pix com QR e copia e cola (BR Code oficial), cartão com parcelas, ingresso com QR code por pessoa, "Meus ingressos", e-mail, vendas e portaria (entra uma vez só) | 🧪 só no modo demonstração (sem cobrança real). Falta intermediador de pagamento, tabela + RLS e envio de e-mail |
| Excluir conta (apaga dados e arquivos; comunidades passam ao membro mais antigo) | ✅ |
| Termos de uso, Política de Privacidade e aviso de não afiliação | ✅ rascunho, revisar com advogado (`src/lib/legal.ts`) |
| "Esqueci a senha": entra com código por e-mail e cria nova senha; troca de senha no perfil | ✅ |
| Cadastro com nome de usuário único (validado no app e no banco), curso (lista com busca ou "Outro") e semestre obrigatórios | ✅ |
| Vínculo confirmado por código no e-mail institucional (um endereço por conta, hash no banco, limite de tentativas e reenvios) | ✅ |
| Sem acesso ao e-mail institucional: comprovante enviado pelo perfil, aprovado na moderação | ✅ |
| Convites individuais: 3 ativos por pessoa, 5 usos cada, com rastreio de quem convidou | ✅ |
| Foto de perfil (recorte quadrado 256 px, visível só para a própria comunidade) | ✅ |
| **Conexões:** seguir, "conectados" (mútuo), perfil público com rolês em comum, seguidores/seguindo | ✅ |
| Sugestões de pessoas por rolês em comum, conexões, comunidades, curso e interesses | ✅ |
| Feed "Para você" / "Seguindo"; perfil reservado (detalhes só para conexões mútuas) | ✅ |
| **Comunidades** (atléticas, baterias, coletivos, CAs, interesse): mural, agenda, membros, admins, selo oficial | ✅ |
| **Saídas** (combis/ônibus) com ponto de partida, horário, vagas, valor e reserva de lugar | ✅ |
| Início: posts com foto, enquete, validade, curtidas, comentários | ✅ |
| Agora, Eventos (interesse/vou/ingresso), Explorar (recomendações) | ✅ |
| **Bora?**: criar, entrar/sair, lotação garantida no banco, cancelar, comentar | ✅ |
| Denúncia (posts, comentários, recomendações, Bora?, eventos) + bloqueio | ✅ |
| Painel de moderação: fila de denúncias, remoção de conteúdo, aprovação de vínculo | ✅ |
| Tempo real + puxar para atualizar | ✅ |
| Notificações push | ⏳ precisa de projeto EAS e build de desenvolvimento |
| Paginação do feed (hoje carrega os últimos 30 dias, até 200 posts) | ⏳ basta enquanto houver uma comunidade |

## Estrutura

```
src/
  app/                rotas (cada arquivo é uma tela)
    (tabs)/           Início, Agora, [+ Criar], Eventos, Explorar
    criar.tsx         modal: publicação / Bora? / evento
    denunciar.tsx     modal de denúncia
    moderacao.tsx     painel (só moderadores/admins)
  components/         UI, cards, comentários, aviso de erro
  lib/
    store.tsx         estado + ações (modo demo ou Supabase, mesma interface)
    remote.ts         leitura/escrita no Supabase (mapeamento banco ↔ app)
    supabase.ts       cliente (só existe com .env.local)
    seed.ts           dados fictícios do modo demo
supabase/
  migrations/         schema, RLS, storage, triggers, RPCs de moderação
  functions/          Edge Functions (Deno): verificar-vinculo envia o código ao e-mail institucional
  seed.sql            lugares e eventos de exemplo
tests/
  db/                 cenários de RLS (PGlite)
  e2e/                fluxos no navegador (Playwright)
```

## Multi-universidade

Todo registro tem `community_id`, e o RLS limita leitura e escrita à comunidade de quem está logado. Os testes de banco garantem que um aluno da PUC não vê nem interage com conteúdo do Mackenzie.

As universidades ficam em `src/lib/community.ts` (`COMMUNITIES`): nome, domínios de e-mail, lista oficial de cursos, prefixo de convite, foto da capa e `status` (`ativa` ou `dormindo`). O app usa a do build (`EXPO_PUBLIC_COMMUNITY`, padrão `mackenzie`).

**PUC-SP (dormindo).** Já está configurada: 33 cursos de pucsp.br/graduacao, e-mail `@pucsp.edu.br` (a confirmar), capa do Pátio da Cruz (CC0) e convites de demonstração `PUC2026` e `FUNDADORES`.
- **Testar:** no site de demonstração, abra `…/campus/?comunidade=puc-sp`. Uma faixa amarela indica o teste, que vale só naquele navegador. Os dados de demonstração ficam separados dos do Mackenzie. Para voltar, use "Sair do teste" ou `?comunidade=mackenzie`. O teste só funciona no modo demonstração; com o Supabase ligado, o parâmetro é ignorado.
- **Acordar:**
  1. No SQL Editor, rode `supabase/migrations/0009_puc_sp.sql`. Ele pode rodar antes: só cadastra a PUC desligada.
  2. Rode os dois comandos de "acordar" que estão no topo desse arquivo, para ligar a comunidade e criar o convite inicial.
  3. No app, mude `status` para `ativa` e faça o build com `EXPO_PUBLIC_COMMUNITY=puc-sp`.

Para abrir outra universidade, repita o modelo da PUC: um registro em `COMMUNITIES`, uma migration com a linha em `communities` (desligada) e convites na hora de acordar.

## Pendências de negócio

- Confirmar com o Mackenzie os domínios de e-mail dos alunos.
- Trocar os lugares e eventos de exemplo por reais e verificados (ver `supabase/seed.sql`).
- Revisar com advogado os Termos e a Política de Privacidade (`src/lib/legal.ts`) e preencher controlador, CNPJ e e-mail de contato (hoje `privacidade@SEU-DOMINIO.com.br`).
- Guardar registros de acesso (IP, data e hora) por 6 meses, como exige o art. 15 do Marco Civil: os logs do Supabase não cobrem esse prazo em todos os planos.
