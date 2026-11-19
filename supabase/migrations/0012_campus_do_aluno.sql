-- Campus onde o aluno estuda (um dos campi da universidade, lista no app em src/lib/community.ts).
-- Opcional no banco (contas antigas não têm); o app pede no cadastro e permite trocar no perfil.
-- Pode rodar de novo sem erro.

alter table public.profiles add column if not exists campus text;
alter table public.profiles drop constraint if exists campus_length;
alter table public.profiles add constraint campus_length check (campus is null or char_length(campus) <= 120);
grant update (campus) on public.profiles to authenticated;

-- ───────────────────────── Cadastro ─────────────────────────
-- Metadata do signup: { name, handle, course, campus, semester, invite_code }. Igual à 0006, mais o campus.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_invite invites%rowtype;
  v_email  text := lower(trim(new.email));
  v_domain text := split_part(lower(trim(new.email)), '@', 2);
  v_handle text := lower(trim(coalesce(new.raw_user_meta_data->>'handle', '')));
  v_course text := nullif(trim(new.raw_user_meta_data->>'course'), '');
  v_semester text := nullif(trim(new.raw_user_meta_data->>'semester'), '');
  v_campus text := left(nullif(trim(new.raw_user_meta_data->>'campus'), ''), 120);
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

  insert into profiles (id, community_id, name, handle, course, campus, semester, verification, invited_with)
  values (
    new.id,
    v_comm.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
    v_handle,
    v_course,
    v_campus,
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
