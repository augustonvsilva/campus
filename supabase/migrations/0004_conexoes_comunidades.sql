-- Campus — conexões entre estudantes (seguir) e comunidades internas
-- (atléticas, baterias, coletivos…) com mural, agenda e saídas (combis/ônibus).
-- Observação de nomenclatura: no banco, "communities" são as universidades; as comunidades
-- criadas pelos estudantes ficam na tabela "groups" (no app, aparecem como "Comunidades").

-- ───────────────────────── Seguir ─────────────────────────
create table public.follows (
  follower_id uuid not null references public.profiles on delete cascade,
  followee_id uuid not null references public.profiles on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index on public.follows (followee_id);
alter table public.follows enable row level security;

create policy "ver conexões da comunidade" on public.follows for select
  using (exists (select 1 from profiles p where p.id = follower_id and p.community_id = my_community()));
create policy "seguir alguém da comunidade" on public.follows for insert
  with check (follower_id = auth.uid()
    and exists (select 1 from profiles p where p.id = followee_id and p.community_id = my_community()));
create policy "deixar de seguir" on public.follows for delete using (follower_id = auth.uid());

-- ───────────────────────── Comunidades (groups) ─────────────────────────
create table public.groups (
  id           uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities,
  name         text not null check (char_length(name) between 3 and 60),
  kind         text not null check (kind in ('atletica', 'bateria', 'coletivo', 'curso', 'interesse')),
  description  text not null default '' check (char_length(description) <= 500),
  color        text not null default '#C8F25A' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  verified     boolean not null default false,   -- selo "oficial", só a moderação concede
  created_by   uuid references public.profiles on delete set null,
  created_at   timestamptz not null default now(),
  removed_at   timestamptz,
  unique (community_id, name)
);

create table public.group_members (
  group_id  uuid not null references public.groups on delete cascade,
  user_id   uuid not null references public.profiles on delete cascade,
  role      text not null default 'membro' check (role in ('admin', 'membro')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index on public.group_members (user_id);

create or replace function public.is_group_member(p_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members m join groups g on g.id = m.group_id
                 where m.group_id = p_group and m.user_id = auth.uid()
                   and g.community_id = my_community() and g.removed_at is null)
$$;

create or replace function public.is_group_admin(p_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members m join groups g on g.id = m.group_id
                 where m.group_id = p_group and m.user_id = auth.uid() and m.role = 'admin'
                   and g.community_id = my_community() and g.removed_at is null)
$$;

-- Quem cria vira admin automaticamente.
create or replace function public.group_creator_is_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into group_members (group_id, user_id, role) values (new.id, new.created_by, 'admin');
  end if;
  return new;
end $$;
create trigger group_creator_admin after insert on public.groups
  for each row execute function public.group_creator_is_admin();

-- Só a moderação concede/retira o selo de comunidade oficial.
create or replace function public.protect_group_verified() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.verified is distinct from old.verified and not is_moderator() then
    raise exception 'só a moderação altera o selo oficial';
  end if;
  return new;
end $$;
create trigger group_verified_guard before update on public.groups
  for each row execute function public.protect_group_verified();

-- Toda comunidade precisa manter pelo menos um admin.
create or replace function public.keep_one_group_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin')
     and exists (select 1 from groups where id = old.group_id)
     and not exists (select 1 from group_members
                     where group_id = old.group_id and role = 'admin' and user_id <> old.user_id) then
    raise exception 'a comunidade precisa de pelo menos um admin';
  end if;
  return coalesce(new, old);
end $$;
create trigger group_keep_admin before update or delete on public.group_members
  for each row execute function public.keep_one_group_admin();

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create policy "ver comunidades" on public.groups for select
  using (community_id = my_community() and removed_at is null);
create policy "criar comunidade" on public.groups for insert
  with check (created_by = auth.uid() and community_id = my_community() and is_verified()
    and (verified = false or is_moderator()));
create policy "admin edita a comunidade" on public.groups for update
  using (is_group_admin(id) or is_moderator()) with check (community_id = my_community());

create policy "ver membros" on public.group_members for select
  using (exists (select 1 from groups g where g.id = group_id and g.community_id = my_community()));
create policy "entrar na comunidade" on public.group_members for insert
  with check (user_id = auth.uid() and role = 'membro'
    and exists (select 1 from groups g where g.id = group_id and g.community_id = my_community() and g.removed_at is null));
create policy "admin muda papel" on public.group_members for update
  using (is_group_admin(group_id)) with check (is_group_admin(group_id));
create policy "sair ou ser removido" on public.group_members for delete
  using (user_id = auth.uid() or is_group_admin(group_id));

-- ───────────────────────── Posts e eventos de comunidades ─────────────────────────
alter table public.posts  add column group_id uuid references public.groups on delete cascade;
alter table public.events add column group_id uuid references public.groups on delete cascade;
create index on public.posts (group_id, created_at desc);
create index on public.events (group_id, starts_at);

alter table public.events drop constraint events_category_check;
alter table public.events add constraint events_category_check
  check (category in ('festa', 'jogo', 'treino', 'cultura', 'academico', 'encontro'));

-- Conteúdo de comunidade removida pela moderação some junto.
create or replace function public.group_is_active(p_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_group is null or exists (select 1 from groups where id = p_group and removed_at is null)
$$;

drop policy "ler posts" on public.posts;
create policy "ler posts" on public.posts for select
  using (community_id = my_community() and removed_at is null and (expires_at is null or expires_at > now())
    and group_is_active(group_id));

drop policy "ler eventos" on public.events;
create policy "ler eventos" on public.events for select
  using (community_id = my_community() and removed_at is null and group_is_active(group_id));

drop policy "criar post" on public.posts;
create policy "criar post" on public.posts for insert
  with check (author_id = auth.uid() and community_id = my_community() and is_verified()
    and (group_id is null or is_group_member(group_id)));

drop policy "criar evento" on public.events;
create policy "criar evento" on public.events for insert
  with check (created_by = auth.uid() and community_id = my_community() and is_verified() and sponsored = false
    and (group_id is null or is_group_admin(group_id)));

drop policy "editar o próprio evento" on public.events;
create policy "editar evento" on public.events for update
  using (created_by = auth.uid() or is_moderator() or (group_id is not null and is_group_admin(group_id)))
  with check (community_id = my_community() and (sponsored = false or is_moderator()));

-- ───────────────────────── Saídas (combis, ônibus, caronas organizadas) ─────────────────────────
create table public.rides (
  id              uuid primary key default gen_random_uuid(),
  community_id    text not null references public.communities,
  group_id        uuid not null references public.groups on delete cascade,
  event_id        uuid references public.events on delete set null,
  title           text not null check (char_length(title) between 3 and 80),
  departs_at      timestamptz not null,
  departure_point text not null check (char_length(departure_point) between 3 and 100),
  destination     text not null check (char_length(destination) between 3 and 100),
  seats           int check (seats is null or seats between 1 and 200),
  price           text check (price is null or char_length(price) <= 30),
  notes           text check (notes is null or char_length(notes) <= 500),
  created_by      uuid references public.profiles on delete set null,
  created_at      timestamptz not null default now(),
  cancelled_at    timestamptz
);
create index on public.rides (community_id, departs_at);

create table public.ride_reservations (
  ride_id    uuid not null references public.rides on delete cascade,
  user_id    uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ride_id, user_id)
);

create or replace function public.check_ride_seats() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_seats int;
  v_cancelled timestamptz;
  v_community text;
  v_count int;
begin
  select seats, cancelled_at, community_id into v_seats, v_cancelled, v_community
    from rides where id = new.ride_id for update;
  if v_community is distinct from my_community() then return new; end if; -- o RLS recusa em seguida
  if v_cancelled is not null then raise exception 'saída cancelada'; end if;
  if v_seats is not null then
    select count(*) into v_count from ride_reservations where ride_id = new.ride_id;
    if v_count >= v_seats then raise exception 'saída lotada'; end if;
  end if;
  return new;
end $$;
create trigger ride_seats before insert on public.ride_reservations
  for each row execute function public.check_ride_seats();

alter table public.rides enable row level security;
alter table public.ride_reservations enable row level security;

create policy "ver saídas" on public.rides for select
  using (community_id = my_community() and group_is_active(group_id));
create policy "admin cria saída" on public.rides for insert
  with check (created_by = auth.uid() and community_id = my_community() and is_group_admin(group_id));
create policy "admin edita saída" on public.rides for update
  using (is_group_admin(group_id)) with check (community_id = my_community() and is_group_admin(group_id));
create policy "admin apaga saída" on public.rides for delete using (is_group_admin(group_id));

create policy "ver reservas" on public.ride_reservations for select
  using (exists (select 1 from rides r where r.id = ride_id and r.community_id = my_community()));
create policy "reservar lugar" on public.ride_reservations for insert
  with check (user_id = auth.uid() and exists (select 1 from rides r where r.id = ride_id and r.community_id = my_community()));
create policy "cancelar reserva" on public.ride_reservations for delete using (user_id = auth.uid());

-- ───────────────────────── Moderação ─────────────────────────
alter table public.reports drop constraint reports_target_type_check;
alter table public.reports add constraint reports_target_type_check check (target_type in
  ('post', 'bora', 'evento', 'lugar', 'usuario', 'comentario', 'recomendacao', 'comunidade', 'saida'));

create or replace function public.remove_content(p_type text, p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_moderator() then raise exception 'sem permissão'; end if;
  case p_type
    when 'post'         then update posts    set removed_at = now() where id = p_id and community_id = my_community();
    when 'bora'         then update boras    set removed_at = now() where id = p_id and community_id = my_community();
    when 'evento'       then update events   set removed_at = now() where id = p_id and community_id = my_community();
    when 'comentario'   then update comments set removed_at = now() where id = p_id and community_id = my_community();
    when 'comunidade'   then update groups   set removed_at = now() where id = p_id and community_id = my_community();
    when 'saida'        then update rides    set cancelled_at = now() where id = p_id and community_id = my_community();
    when 'recomendacao' then
      update place_recommendations r set removed_at = now()
        from places p where r.id = p_id and p.id = r.place_id and p.community_id = my_community();
    else raise exception 'tipo de conteúdo inválido: %', p_type;
  end case;
end $$;

-- ───────────────────────── Realtime ─────────────────────────
alter publication supabase_realtime add table
  public.follows, public.groups, public.group_members, public.rides, public.ride_reservations;
