-- Campus: nick (@handle) escolhido pelo aluno, único; curso e semestre obrigatórios no cadastro.
-- Regras do nick espelhadas em src/lib/handle.ts.

-- ───────────────────────── Regras do nick ─────────────────────────
create or replace function public.handle_problem(p_handle text) returns text
language sql immutable set search_path = public as $$
  select case
    when p_handle is null or char_length(p_handle) < 3 then 'curto'
    when char_length(p_handle) > 20 then 'longo'
    when p_handle !~ '^[a-z0-9._]+$' then 'caracteres'
    when p_handle like '.%' or p_handle like '%.' or p_handle like '%..%' then 'pontos'
    when p_handle = any (array['admin', 'administrador', 'campus', 'equipe', 'moderacao', 'moderador', 'suporte',
                               'oficial', 'mackenzie', 'mackenzista', 'universidade', 'visitante']) then 'reservado'
  end
$$;

-- Usada pela tela de cadastro (antes do login) e pela edição de perfil.
-- Responde só se o nick está livre; nicks já aparecem nos perfis da comunidade.
create or replace function public.handle_available(p_handle text) returns boolean
language sql stable security definer set search_path = public as $$
  select handle_problem(lower(trim(p_handle))) is null
     and not exists (select 1 from profiles where handle = lower(trim(p_handle)) and id is distinct from auth.uid())
$$;
revoke execute on function public.handle_available(text) from public;
grant execute on function public.handle_available(text) to anon, authenticated;

-- ───────────────────────── Contas existentes ─────────────────────────
-- Quem ainda não tem nick válido recebe um gerado (primeiro nome + trecho do id).
-- O aluno pode trocar depois, no perfil.
do $$
declare
  r record;
  v_base text;
  v_try text;
  n int;
begin
  for r in select id, name, handle from public.profiles
            where handle is null or public.handle_problem(handle) is not null loop
    v_base := left(coalesce(nullif(regexp_replace(translate(lower(split_part(r.name, ' ', 1)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'), '[^a-z0-9_]', '', 'g'), ''), 'aluno'), 12);
    if char_length(v_base) < 3 then v_base := 'aluno'; end if;
    n := 4;
    loop
      v_try := v_base || '.' || substr(replace(r.id::text, '-', ''), 1, n);
      exit when not exists (select 1 from public.profiles where handle = v_try);
      n := n + 1;
    end loop;
    update public.profiles set handle = v_try where id = r.id;
  end loop;
end $$;

alter table public.profiles alter column handle set not null;
alter table public.profiles add constraint handle_format check (public.handle_problem(handle) is null);

-- ───────────────────────── Cadastro ─────────────────────────
-- Metadata do signup: { name, handle, course, semester, invite_code }.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_invite invites%rowtype;
  v_email  text := lower(trim(new.email));
  v_domain text := split_part(lower(trim(new.email)), '@', 2);
  v_handle text := lower(trim(coalesce(new.raw_user_meta_data->>'handle', '')));
  v_course text := nullif(trim(new.raw_user_meta_data->>'course'), '');
  v_semester text := nullif(trim(new.raw_user_meta_data->>'semester'), '');
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
  if handle_problem(v_handle) is not null then raise exception 'nick inválido'; end if;
  if exists (select 1 from profiles where handle = v_handle) then raise exception 'nick indisponível'; end if;
  if v_course is null or char_length(v_course) < 2 then raise exception 'curso obrigatório'; end if;
  if v_semester is null then raise exception 'semestre obrigatório'; end if;

  select * into v_comm from communities where id = v_invite.community_id;
  update invites set uses = uses + 1 where code = v_invite.code;

  v_institutional := v_domain = any (v_comm.email_domains)
    and not exists (select 1 from institutional_emails where email = v_email);

  insert into profiles (id, community_id, name, handle, course, semester, verification, invited_with)
  values (
    new.id,
    v_comm.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
    v_handle,
    v_course,
    v_semester,
    case when v_institutional then 'email' else 'pending' end::verification_status,
    v_invite.code
  );
  if v_institutional then
    insert into institutional_emails (user_id, community_id, email) values (new.id, v_comm.id, v_email);
  end if;
  insert into notification_settings (user_id) values (new.id);
  return new;
end $$;
