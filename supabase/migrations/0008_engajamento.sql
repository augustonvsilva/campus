-- Campus: editar o próprio conteúdo, conversa nas saídas, chave Pix e central de atividade.

-- ───────────────────────── Editar publicações e comentários ─────────────────────────
alter table public.posts    add column edited_at timestamptz;
alter table public.comments add column edited_at timestamptz;

-- O autor só pode mudar o texto. Qualquer outra coluna (comunidade, remoção pela moderação,
-- validade, foto…) fica travada. A moderação continua podendo remover (remove_content).
create or replace function public.guard_own_edit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() nulo = service role / SQL Editor: sem restrição.
  if auth.uid() is not null and not is_moderator()
     and (to_jsonb(new) - 'body' - 'edited_at') is distinct from (to_jsonb(old) - 'body' - 'edited_at') then
    raise exception 'só o texto pode ser editado';
  end if;
  if new.body is distinct from old.body then
    new.edited_at := now();
  end if;
  return new;
end $$;

create trigger posts_guard_edit before update on public.posts
  for each row execute function public.guard_own_edit();
create trigger comments_guard_edit before update on public.comments
  for each row execute function public.guard_own_edit();

create policy "editar o próprio post" on public.posts for update
  using (author_id = auth.uid() and removed_at is null) with check (author_id = auth.uid());
create policy "editar o próprio comentário" on public.comments for update
  using (author_id = auth.uid() and removed_at is null) with check (author_id = auth.uid());

-- ───────────────────────── Conversa nas saídas ─────────────────────────
alter table public.comments add column ride_id uuid references public.rides on delete cascade;
alter table public.comments drop constraint comments_check;
alter table public.comments add constraint comments_one_target check (num_nonnulls(post_id, bora_id, ride_id) = 1);
create index on public.comments (ride_id);

drop policy "comentar" on public.comments;
create policy "comentar" on public.comments for insert
  with check (author_id = auth.uid() and community_id = my_community() and is_verified()
    and (exists (select 1 from posts p where p.id = post_id and p.community_id = my_community())
      or exists (select 1 from boras b where b.id = bora_id and b.community_id = my_community())
      or exists (select 1 from rides r where r.id = ride_id and r.community_id = my_community()
                   and r.cancelled_at is null and group_is_active(r.group_id))));

-- ───────────────────────── Chave Pix da saída ─────────────────────────
-- Só exibida para facilitar o pagamento combinado com a comunidade; o Campus não intermedeia.
alter table public.rides add column pix_key text check (pix_key is null or char_length(pix_key) <= 140);

-- ───────────────────────── Central de atividade ─────────────────────────
-- Tudo o que outras pessoas fizeram com o seu conteúdo nos últimos 30 dias.
-- security invoker: o RLS de cada tabela continua valendo.
create or replace function public.my_activity()
returns table (kind text, actor_id uuid, target_type text, target_id uuid, snippet text, at timestamptz)
language sql stable set search_path = public as $$
  with me as (select auth.uid() as id)
  select * from (
    -- Começou a seguir você
    select 'follow', f.follower_id, 'usuario', f.follower_id, null::text, f.created_at
      from follows f, me where f.followee_id = me.id
    union all
    -- Curtiu sua publicação
    select 'like', l.user_id, 'post', p.id, left(p.body, 80), l.created_at
      from post_likes l join posts p on p.id = l.post_id, me
     where p.author_id = me.id and l.user_id <> me.id
    union all
    -- Comentou no seu post, Bora? ou saída
    select 'comment', c.author_id,
           case when c.post_id is not null then 'post' when c.bora_id is not null then 'bora' else 'saida' end,
           coalesce(c.post_id, c.bora_id, c.ride_id), left(c.body, 80), c.created_at
      from comments c, me
     where c.author_id <> me.id
       and (exists (select 1 from posts p where p.id = c.post_id and p.author_id = me.id)
         or exists (select 1 from boras b where b.id = c.bora_id and b.author_id = me.id)
         or exists (select 1 from rides r where r.id = c.ride_id and r.created_by = me.id))
    union all
    -- Respondeu numa conversa em que você comentou (em conteúdo de outra pessoa)
    select 'reply', c.author_id,
           case when c.post_id is not null then 'post' when c.bora_id is not null then 'bora' else 'saida' end,
           coalesce(c.post_id, c.bora_id, c.ride_id), left(c.body, 80), c.created_at
      from comments c, me
     where c.author_id <> me.id
       and exists (select 1 from comments mine where mine.author_id = me.id and mine.created_at < c.created_at
                     and (mine.post_id = c.post_id or mine.bora_id = c.bora_id or mine.ride_id = c.ride_id))
       and not exists (select 1 from posts p where p.id = c.post_id and p.author_id = me.id)
       and not exists (select 1 from boras b where b.id = c.bora_id and b.author_id = me.id)
       and not exists (select 1 from rides r where r.id = c.ride_id and r.created_by = me.id)
    union all
    -- Entrou no seu Bora?
    select 'bora_join', bp.user_id, 'bora', b.id, b.activity, bp.joined_at
      from bora_participants bp join boras b on b.id = bp.bora_id, me
     where b.author_id = me.id and bp.user_id <> me.id
    union all
    -- Reservou lugar na saída que você criou
    select 'ride_reserve', rr.user_id, 'saida', r.id, r.title, rr.created_at
      from ride_reservations rr join rides r on r.id = rr.ride_id, me
     where r.created_by = me.id and rr.user_id <> me.id
    union all
    -- Entrou numa comunidade que você administra
    select 'group_join', gm.user_id, 'comunidade', g.id, g.name, gm.joined_at
      from group_members gm join groups g on g.id = gm.group_id, me
     where gm.user_id <> me.id
       and exists (select 1 from group_members a where a.group_id = g.id and a.user_id = me.id and a.role = 'admin')
  ) a (kind, actor_id, target_type, target_id, snippet, at)
  where a.at > now() - interval '30 days'
  order by a.at desc
  limit 100
$$;

revoke execute on function public.my_activity() from public, anon;
grant execute on function public.my_activity() to authenticated;
