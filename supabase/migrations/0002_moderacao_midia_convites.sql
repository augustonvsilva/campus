-- Campus — moderação, fotos, convites individuais, lotação do Bora? e realtime.

-- ───────────────────────── Fotos em publicações ─────────────────────────
alter table public.posts add column image_path text;

-- Buckets privados: imagens só são lidas por membros da comunidade (URLs assinadas).
-- Caminho dos arquivos: <community_id>/<user_id>/<arquivo>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('post-images',  'post-images',  false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('verification', 'verification', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "ler imagens da comunidade" on storage.objects for select to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = public.my_community());
create policy "enviar a própria imagem" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images' and public.is_verified()
    and (storage.foldername(name))[1] = public.my_community()
    and (storage.foldername(name))[2] = auth.uid()::text);
create policy "apagar a própria imagem" on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "enviar comprovante" on storage.objects for insert to authenticated
  with check (bucket_id = 'verification'
    and (storage.foldername(name))[1] = public.my_community()
    and (storage.foldername(name))[2] = auth.uid()::text);
create policy "ver comprovante" on storage.objects for select to authenticated
  using (bucket_id = 'verification' and (storage.foldername(name))[1] = public.my_community()
    and ((storage.foldername(name))[2] = auth.uid()::text or public.is_moderator()));

-- ───────────────────────── Lotação do Bora? ─────────────────────────
create or replace function public.check_bora_capacity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_cap int;
  v_cancelled timestamptz;
  v_community text;
  v_count int;
begin
  select capacity, cancelled_at, community_id into v_cap, v_cancelled, v_community
    from boras where id = new.bora_id for update;
  -- Não revela nada sobre planos de outras comunidades (o RLS recusa em seguida).
  if v_community is distinct from my_community() then return new; end if;
  if v_cancelled is not null then raise exception 'plano cancelado'; end if;
  if v_cap is not null then
    select count(*) into v_count from bora_participants where bora_id = new.bora_id;
    if v_count >= v_cap then raise exception 'plano lotado'; end if;
  end if;
  return new;
end $$;

create trigger bora_capacity before insert on public.bora_participants
  for each row execute function public.check_bora_capacity();

-- ───────────────────────── Convites individuais ─────────────────────────
-- Cada membro verificado gera até 3 convites ativos, com até 5 usos cada (policy de insert na 0001).
create or replace function public.check_invite_quota() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null and (
    select count(*) from invites where created_by = new.created_by and uses < max_uses
      and (expires_at is null or expires_at > now())) >= 3 then
    raise exception 'limite de convites ativos atingido';
  end if;
  return new;
end $$;

create trigger invite_quota before insert on public.invites
  for each row execute function public.check_invite_quota();

-- Quem entrou com convite de quem (métrica "convites convertidos").
alter table public.profiles add column invited_with text references public.invites on delete set null;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_invite invites%rowtype;
  v_domain text := lower(split_part(new.email, '@', 2));
  v_comm   communities%rowtype;
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

  insert into profiles (id, community_id, name, course, verification, invited_with)
  values (
    new.id,
    v_comm.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data->>'course'), ''),
    case when v_domain = any (v_comm.email_domains) then 'email' else 'pending' end::verification_status,
    v_invite.code
  );
  insert into notification_settings (user_id) values (new.id);
  return new;
end $$;

-- ───────────────────────── Moderação ─────────────────────────
create or replace function public.remove_content(p_type text, p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_moderator() then raise exception 'sem permissão'; end if;
  case p_type
    when 'post'         then update posts    set removed_at = now() where id = p_id and community_id = my_community();
    when 'bora'         then update boras    set removed_at = now() where id = p_id and community_id = my_community();
    when 'evento'       then update events   set removed_at = now() where id = p_id and community_id = my_community();
    when 'comentario'   then update comments set removed_at = now() where id = p_id and community_id = my_community();
    when 'recomendacao' then
      update place_recommendations r set removed_at = now()
        from places p where r.id = p_id and p.id = r.place_id and p.community_id = my_community();
    else raise exception 'tipo de conteúdo inválido: %', p_type;
  end case;
end $$;

create or replace function public.review_verification(p_user uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_moderator() then raise exception 'sem permissão'; end if;
  update profiles
     set verification = (case when p_approve then 'manual' else 'rejected' end)::verification_status
   where id = p_user and community_id = my_community();
  update verification_requests
     set status = case when p_approve then 'aprovada' else 'recusada' end, reviewed_by = auth.uid()
   where user_id = p_user and status = 'aberta';
end $$;

revoke execute on function public.remove_content(text, uuid) from public, anon;
revoke execute on function public.review_verification(uuid, boolean) from public, anon;
grant execute on function public.remove_content(text, uuid) to authenticated;
grant execute on function public.review_verification(uuid, boolean) to authenticated;

-- Pedido de verificação: só o próprio usuário e só um aberto por vez.
create unique index one_open_request_per_user on public.verification_requests (user_id) where status = 'aberta';

-- ───────────────────────── Realtime ─────────────────────────
-- O app escuta mudanças e recarrega a comunidade (o RLS também vale para o realtime).
alter publication supabase_realtime add table
  public.posts, public.comments, public.post_likes, public.poll_votes,
  public.events, public.event_attendance, public.boras, public.bora_participants,
  public.place_recommendations;
