-- Campus: cadastro com qualquer e-mail + verificação de vínculo pelo e-mail institucional.
--
-- O login pode usar o e-mail pessoal, que continua valendo depois da formatura. O vínculo
-- é comprovado com um código de 6 dígitos enviado para o e-mail institucional
-- (@mackenzista.com.br etc.). Fluxo:
--   1. App chama a Edge Function `verificar-vinculo` com { email }.
--   2. A função (service role) chama issue_institutional_code(): valida domínio, unicidade e
--      limites, guarda o hash do código e devolve o código em claro só para a função.
--   3. A função envia o código por e-mail (Resend).
--   4. App chama confirm_institutional_code(código) direto pelo PostgREST.
-- O código nunca volta ao app: só quem lê a caixa institucional consegue confirmar.

-- ───────────────────────── Tabelas ─────────────────────────
-- E-mail institucional confirmado de cada conta. Um endereço só verifica uma conta.
create table public.institutional_emails (
  user_id      uuid primary key references public.profiles on delete cascade,
  community_id text not null references public.communities,
  email        text not null unique check (email = lower(email)),
  verified_at  timestamptz not null default now()
);

-- Código pendente (no máximo um por conta). Só a service role e as funções abaixo acessam.
create table public.institutional_email_codes (
  user_id      uuid primary key references public.profiles on delete cascade,
  email        text not null,
  code_hash    text not null,
  expires_at   timestamptz not null,
  attempts     int not null default 0,
  last_sent_at timestamptz not null default now(),
  window_start timestamptz not null default now(),
  sends_in_window int not null default 1
);

alter table public.institutional_emails      enable row level security;
alter table public.institutional_email_codes enable row level security;

-- Cada um vê só o próprio e-mail institucional. Escrita apenas pelas funções (security definer).
create policy "meu e-mail institucional" on public.institutional_emails for select using (user_id = auth.uid());
revoke insert, update, delete on public.institutional_emails from anon, authenticated;
revoke all on public.institutional_email_codes from anon, authenticated;

-- ───────────────────────── Funções ─────────────────────────
create or replace function public.code_hash(p_user uuid, p_code text) returns text
language sql immutable set search_path = public as $$
  select encode(sha256(convert_to(p_user::text || ':' || p_code, 'UTF8')), 'hex')
$$;
revoke execute on function public.code_hash(uuid, text) from public, anon, authenticated;

-- Gera e registra um código. Chamada só pela Edge Function (service role).
-- Retorna o código em claro para ser enviado por e-mail.
create or replace function public.issue_institutional_code(p_user uuid, p_email text) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_email  text := lower(trim(p_email));
  v_domain text := split_part(lower(trim(p_email)), '@', 2);
  v_prof   profiles%rowtype;
  v_row    institutional_email_codes%rowtype;
  v_code   text;
begin
  select * into v_prof from profiles where id = p_user;
  if not found then raise exception 'conta não encontrada'; end if;
  if v_prof.verification = 'email' then raise exception 'vínculo já verificado'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'e-mail inválido'; end if;
  if not exists (select 1 from communities where id = v_prof.community_id and v_domain = any (email_domains)) then
    raise exception 'domínio não institucional';
  end if;
  if exists (select 1 from institutional_emails where email = v_email and user_id <> p_user) then
    raise exception 'e-mail institucional já usado';
  end if;

  select * into v_row from institutional_email_codes where user_id = p_user for update;
  if found then
    if v_row.last_sent_at > now() - interval '60 seconds' then raise exception 'aguarde para reenviar'; end if;
    if v_row.window_start > now() - interval '1 day' and v_row.sends_in_window >= 5 then
      raise exception 'limite diário de códigos';
    end if;
  end if;

  -- 6 dígitos a partir de gen_random_uuid() (gerador criptográfico do Postgres, sem extensão).
  v_code := lpad(((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))::bit(48)::bigint) % 1000000)::text, 6, '0');

  insert into institutional_email_codes (user_id, email, code_hash, expires_at)
  values (p_user, v_email, code_hash(p_user, v_code), now() + interval '15 minutes')
  on conflict (user_id) do update set
    email = excluded.email,
    code_hash = excluded.code_hash,
    expires_at = excluded.expires_at,
    attempts = 0,
    last_sent_at = now(),
    window_start = case when institutional_email_codes.window_start > now() - interval '1 day'
                        then institutional_email_codes.window_start else now() end,
    sends_in_window = case when institutional_email_codes.window_start > now() - interval '1 day'
                           then institutional_email_codes.sends_in_window + 1 else 1 end;
  return v_code;
end $$;

revoke execute on function public.issue_institutional_code(uuid, text) from public, anon, authenticated;
grant execute on function public.issue_institutional_code(uuid, text) to service_role;

-- Confirma o código digitado. Retorna um status em vez de lançar erro, para que a
-- contagem de tentativas não seja desfeita junto com a transação.
--   ok | incorreto | expirado | tentativas | sem_codigo | em_uso
create or replace function public.confirm_institutional_code(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_row institutional_email_codes%rowtype;
  v_community text;
begin
  if v_uid is null then raise exception 'sem sessão'; end if;
  select * into v_row from institutional_email_codes where user_id = v_uid for update;
  if not found then return 'sem_codigo'; end if;
  if v_row.expires_at < now() then return 'expirado'; end if;
  if v_row.attempts >= 5 then return 'tentativas'; end if;
  if v_row.code_hash <> code_hash(v_uid, trim(coalesce(p_code, ''))) then
    update institutional_email_codes set attempts = attempts + 1 where user_id = v_uid;
    return 'incorreto';
  end if;

  -- Alguém pode ter verificado o mesmo endereço enquanto o código estava pendente.
  if exists (select 1 from institutional_emails where email = v_row.email and user_id <> v_uid) then
    delete from institutional_email_codes where user_id = v_uid;
    return 'em_uso';
  end if;

  select community_id into v_community from profiles where id = v_uid;
  insert into institutional_emails (user_id, community_id, email) values (v_uid, v_community, v_row.email)
  on conflict (user_id) do update set email = excluded.email, verified_at = now();
  update profiles set verification = 'email' where id = v_uid;
  -- Se havia comprovante na fila da moderação, ele deixa de ser necessário.
  update verification_requests set status = 'aprovada' where user_id = v_uid and status = 'aberta';
  delete from institutional_email_codes where user_id = v_uid;
  return 'ok';
end $$;

revoke execute on function public.confirm_institutional_code(text) from public, anon;
grant execute on function public.confirm_institutional_code(text) to authenticated;

-- ───────────────────────── Cadastro ─────────────────────────
-- Quem se cadastra direto com o e-mail institucional já provou que tem acesso a ele
-- (recebeu o código de login). Nesse caso o endereço fica registrado e a conta nasce verificada,
-- desde que o endereço não tenha sido usado para verificar outra conta.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_invite invites%rowtype;
  v_email  text := lower(trim(new.email));
  v_domain text := split_part(lower(trim(new.email)), '@', 2);
  v_comm   communities%rowtype;
  v_institutional boolean;
begin
  select * into v_invite from invites
   where code = upper(new.raw_user_meta_data->>'invite_code')
     and uses < max_uses and (expires_at is null or expires_at > now())
   for update;
  if not found then
    raise exception 'convite inválido ou esgotado';
  end if;

  select * into v_comm from communities where id = v_invite.community_id;
  update invites set uses = uses + 1 where code = v_invite.code;

  v_institutional := v_domain = any (v_comm.email_domains)
    and not exists (select 1 from institutional_emails where email = v_email);

  insert into profiles (id, community_id, name, course, verification, invited_with)
  values (
    new.id,
    v_comm.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data->>'course'), ''),
    case when v_institutional then 'email' else 'pending' end::verification_status,
    v_invite.code
  );
  if v_institutional then
    insert into institutional_emails (user_id, community_id, email) values (new.id, v_comm.id, v_email);
  end if;
  insert into notification_settings (user_id) values (new.id);
  return new;
end $$;

-- Contas antigas verificadas pelo e-mail de login: registra o endereço para valer a unicidade.
insert into public.institutional_emails (user_id, community_id, email)
select p.id, p.community_id, lower(u.email)
  from public.profiles p
  join auth.users u on u.id = p.id
  join public.communities c on c.id = p.community_id
 where p.verification = 'email'
   and split_part(lower(u.email), '@', 2) = any (c.email_domains)
on conflict do nothing;
