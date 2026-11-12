-- Campus — schema inicial (Supabase / Postgres)
-- Multi-comunidade desde o início: toda linha de conteúdo tem community_id e o RLS
-- garante que cada estudante só lê/escreve na própria comunidade.
-- Lançamento: apenas a comunidade 'mackenzie'.

create extension if not exists pgcrypto;

-- ───────────────────────── Comunidades ─────────────────────────
create table public.communities (
  id            text primary key,
  name          text not null,
  short_name    text not null,
  city          text,
  email_domains text[] not null default '{}',
  invite_only   boolean not null default true,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

insert into public.communities (id, name, short_name, city, email_domains)
values ('mackenzie', 'Universidade Presbiteriana Mackenzie', 'Mackenzie', 'São Paulo',
        array['mackenzista.com.br', 'mackenzie.br']);  -- confirmar domínios com a instituição

-- ───────────────────────── Perfis ─────────────────────────
create type public.verification_status as enum ('email', 'manual', 'pending', 'rejected');
create type public.member_role as enum ('member', 'moderator', 'admin');

create table public.profiles (
  id             uuid primary key references auth.users on delete cascade,
  community_id   text not null references public.communities,
  name           text not null check (char_length(name) between 2 and 80),
  handle         text unique,
  course         text,
  semester       text,
  interests      text[] not null default '{}',
  verification   public.verification_status not null default 'pending',
  role           public.member_role not null default 'member',
  profile_visible boolean not null default true,
  show_bora_participation boolean not null default true,
  created_at     timestamptz not null default now()
);

create table public.notification_settings (
  user_id     uuid primary key references public.profiles on delete cascade,
  boras       boolean not null default true,
  eventos     boolean not null default true,
  comentarios boolean not null default true
);

-- Pedido de verificação alternativa (sem e-mail institucional).
create table public.verification_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles on delete cascade,
  evidence_path text,             -- arquivo no Storage (bucket privado)
  status      text not null default 'aberta' check (status in ('aberta', 'aprovada', 'recusada')),
  reviewed_by uuid references public.profiles,
  created_at  timestamptz not null default now()
);

-- ───────────────────────── Convites ─────────────────────────
create table public.invites (
  code         text primary key,
  community_id text not null references public.communities,
  created_by   uuid references public.profiles on delete set null,
  max_uses     int not null default 1 check (max_uses > 0),
  uses         int not null default 0,
  expires_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- ───────────────────────── Helpers p/ RLS ─────────────────────────
create or replace function public.my_community() returns text
language sql stable security definer set search_path = public as $$
  select community_id from profiles where id = auth.uid()
$$;

create or replace function public.is_verified() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select verification in ('email', 'manual') from profiles where id = auth.uid()), false)
$$;

create or replace function public.is_moderator() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('moderator', 'admin') from profiles where id = auth.uid()), false)
$$;

-- ───────────────────────── Cadastro (convite + vínculo) ─────────────────────────
-- O app chama supabase.auth.signUp com metadata { name, course, invite_code }.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_invite   invites%rowtype;
  v_domain   text := lower(split_part(new.email, '@', 2));
  v_comm     communities%rowtype;
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

  insert into profiles (id, community_id, name, course, verification)
  values (
    new.id,
    v_comm.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data->>'course'), ''),
    case when v_domain = any (v_comm.email_domains) then 'email' else 'pending' end::verification_status
  );
  insert into notification_settings (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── Feed ─────────────────────────
create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities,
  author_id    uuid not null references public.profiles on delete cascade,
  body         text not null check (char_length(body) between 1 and 2000),
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  removed_at   timestamptz            -- remoção pela moderação (soft delete)
);
create index on public.posts (community_id, created_at desc);

create table public.poll_options (
  id       uuid primary key default gen_random_uuid(),
  post_id  uuid not null references public.posts on delete cascade,
  label    text not null check (char_length(label) between 1 and 60),
  position smallint not null
);

create table public.poll_votes (
  post_id   uuid not null references public.posts on delete cascade,
  option_id uuid not null references public.poll_options on delete cascade,
  user_id   uuid not null references public.profiles on delete cascade,
  primary key (post_id, user_id)
);

create table public.post_likes (
  post_id uuid not null references public.posts on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ───────────────────────── Eventos ─────────────────────────
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities,
  title        text not null check (char_length(title) between 3 and 80),
  category     text not null check (category in ('festa', 'jogo', 'cultura', 'academico', 'encontro')),
  starts_at    timestamptz not null,
  ends_at      timestamptz not null check (ends_at > starts_at),
  location     text not null,
  description  text not null default '',
  organizer    text not null,
  ticket_url   text check (ticket_url is null or ticket_url ~ '^https?://'),
  sponsored    boolean not null default false,  -- só admin marca (ver policy)
  is_public    boolean not null default false,  -- futuro: visível a outras comunidades
  created_by   uuid references public.profiles on delete set null,
  created_at   timestamptz not null default now(),
  removed_at   timestamptz
);
create index on public.events (community_id, starts_at);

create table public.event_attendance (
  event_id uuid not null references public.events on delete cascade,
  user_id  uuid not null references public.profiles on delete cascade,
  status   text not null check (status in ('interested', 'going')),
  primary key (event_id, user_id)
);

-- ───────────────────────── Bora? ─────────────────────────
create table public.boras (
  id            uuid primary key default gen_random_uuid(),
  community_id  text not null references public.communities,
  author_id     uuid not null references public.profiles on delete cascade,
  activity      text not null check (char_length(activity) between 3 and 80),
  starts_at     timestamptz not null,
  meeting_point text not null check (char_length(meeting_point) between 3 and 80),
  visibility    text not null default 'comunidade' check (visibility in ('comunidade', 'link')),
  capacity      int check (capacity is null or capacity >= 2),
  cancelled_at  timestamptz,
  created_at    timestamptz not null default now(),
  removed_at    timestamptz
);
create index on public.boras (community_id, starts_at);

create table public.bora_participants (
  bora_id   uuid not null references public.boras on delete cascade,
  user_id   uuid not null references public.profiles on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (bora_id, user_id)
);

-- Comentários de posts e de Bora? (exatamente um alvo).
create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities,
  post_id      uuid references public.posts on delete cascade,
  bora_id      uuid references public.boras on delete cascade,
  author_id    uuid not null references public.profiles on delete cascade,
  body         text not null check (char_length(body) between 1 and 500),
  created_at   timestamptz not null default now(),
  removed_at   timestamptz,
  check (num_nonnulls(post_id, bora_id) = 1)
);

-- ───────────────────────── Explorar ─────────────────────────
create table public.places (
  id           uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities,
  name         text not null,
  category     text not null check (category in ('bar', 'restaurante', 'cafe', 'estudo')),
  address      text not null,
  price_range  smallint not null check (price_range between 1 and 3),
  hours        text,
  verified     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table public.place_recommendations (
  id         uuid primary key default gen_random_uuid(),
  place_id   uuid not null references public.places on delete cascade,
  author_id  uuid not null references public.profiles on delete cascade,
  body       text not null check (char_length(body) between 5 and 280),
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (place_id, author_id)
);

-- ───────────────────────── Segurança ─────────────────────────
create table public.blocks (
  blocker_id uuid not null references public.profiles on delete cascade,
  blocked_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities,
  reporter_id  uuid not null references public.profiles on delete cascade,
  target_type  text not null check (target_type in ('post', 'bora', 'evento', 'lugar', 'usuario', 'comentario', 'recomendacao')),
  target_id    uuid not null,
  reason       text not null,
  details      text,
  status       text not null default 'aberta' check (status in ('aberta', 'em_analise', 'resolvida', 'descartada')),
  resolved_by  uuid references public.profiles,
  created_at   timestamptz not null default now()
);

-- ───────────────────────── RLS ─────────────────────────
alter table public.communities           enable row level security;
alter table public.profiles              enable row level security;
alter table public.notification_settings enable row level security;
alter table public.verification_requests enable row level security;
alter table public.invites               enable row level security;
alter table public.posts                 enable row level security;
alter table public.poll_options          enable row level security;
alter table public.poll_votes            enable row level security;
alter table public.post_likes            enable row level security;
alter table public.events                enable row level security;
alter table public.event_attendance      enable row level security;
alter table public.boras                 enable row level security;
alter table public.bora_participants     enable row level security;
alter table public.comments              enable row level security;
alter table public.places                enable row level security;
alter table public.place_recommendations enable row level security;
alter table public.blocks                enable row level security;
alter table public.reports               enable row level security;

create policy "comunidades ativas são públicas" on public.communities for select using (is_active);

-- Perfis
create policy "ver perfis da comunidade" on public.profiles for select using (community_id = my_community());
create policy "editar o próprio perfil" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and community_id = my_community());
-- verification, role e community_id só mudam via service role / painel de moderação.
-- (revoke por coluna não anula o grant de tabela do Supabase; por isso o inverso.)
revoke update on public.profiles from authenticated;
grant update (name, handle, course, semester, interests, profile_visible, show_bora_participation)
  on public.profiles to authenticated;

create policy "minhas notificações" on public.notification_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "meus pedidos de verificação" on public.verification_requests for select using (user_id = auth.uid() or is_moderator());
create policy "pedir verificação" on public.verification_requests for insert with check (user_id = auth.uid());

create policy "verificados criam convites" on public.invites for insert
  with check (is_verified() and created_by = auth.uid() and community_id = my_community() and max_uses <= 5);
create policy "ver meus convites" on public.invites for select using (created_by = auth.uid() or is_moderator());

-- Conteúdo: leitura na comunidade; escrita só por verificados, como autor.
create policy "ler posts" on public.posts for select
  using (community_id = my_community() and removed_at is null and (expires_at is null or expires_at > now()));
create policy "criar post" on public.posts for insert
  with check (author_id = auth.uid() and community_id = my_community() and is_verified());
create policy "apagar o próprio post" on public.posts for delete using (author_id = auth.uid());
create policy "moderar posts" on public.posts for update using (is_moderator() and community_id = my_community());

create policy "ler opções" on public.poll_options for select
  using (exists (select 1 from posts p where p.id = post_id and p.community_id = my_community()));
create policy "criar opções no próprio post" on public.poll_options for insert
  with check (exists (select 1 from posts p where p.id = post_id and p.author_id = auth.uid()));

create policy "ler votos" on public.poll_votes for select
  using (exists (select 1 from posts p where p.id = post_id and p.community_id = my_community()));
create policy "votar" on public.poll_votes for insert with check (
  user_id = auth.uid() and is_verified()
  and exists (select 1 from poll_options o join posts p on p.id = o.post_id
              where o.id = option_id and o.post_id = poll_votes.post_id and p.community_id = my_community()));
create policy "mudar voto" on public.poll_votes for delete using (user_id = auth.uid());

create policy "ler curtidas" on public.post_likes for select
  using (exists (select 1 from posts p where p.id = post_id and p.community_id = my_community()));
create policy "curtir" on public.post_likes for insert with check (
  user_id = auth.uid() and exists (select 1 from posts p where p.id = post_id and p.community_id = my_community()));
create policy "descurtir" on public.post_likes for delete using (user_id = auth.uid());

create policy "ler eventos" on public.events for select using (community_id = my_community() and removed_at is null);
create policy "criar evento" on public.events for insert
  with check (created_by = auth.uid() and community_id = my_community() and is_verified() and sponsored = false);
create policy "editar o próprio evento" on public.events for update
  using (created_by = auth.uid() or is_moderator())
  with check (community_id = my_community() and (sponsored = false or is_moderator()));

create policy "ler presença" on public.event_attendance for select
  using (exists (select 1 from events e where e.id = event_id and e.community_id = my_community()));
create policy "marcar presença" on public.event_attendance for all using (user_id = auth.uid()) with check (
  user_id = auth.uid() and exists (select 1 from events e where e.id = event_id and e.community_id = my_community()));

create policy "ler boras" on public.boras for select using (community_id = my_community() and removed_at is null);
create policy "criar bora" on public.boras for insert
  with check (author_id = auth.uid() and community_id = my_community() and is_verified());
create policy "editar/cancelar a própria bora" on public.boras for update using (author_id = auth.uid() or is_moderator());

create policy "ler participantes" on public.bora_participants for select
  using (exists (select 1 from boras b where b.id = bora_id and b.community_id = my_community()));
create policy "entrar na bora" on public.bora_participants for insert with check (
  user_id = auth.uid() and exists (select 1 from boras b where b.id = bora_id and b.community_id = my_community()));
create policy "sair da bora" on public.bora_participants for delete using (user_id = auth.uid());

create policy "ler comentários" on public.comments for select using (community_id = my_community() and removed_at is null);
create policy "comentar" on public.comments for insert
  with check (author_id = auth.uid() and community_id = my_community() and is_verified()
    and (exists (select 1 from posts p where p.id = post_id and p.community_id = my_community())
      or exists (select 1 from boras b where b.id = bora_id and b.community_id = my_community())));
create policy "apagar o próprio comentário" on public.comments for delete using (author_id = auth.uid());

create policy "ler lugares" on public.places for select using (community_id = my_community());
create policy "ler recomendações" on public.place_recommendations for select
  using (removed_at is null and exists (select 1 from places p where p.id = place_id and p.community_id = my_community()));
create policy "recomendar" on public.place_recommendations for insert with check (
  author_id = auth.uid() and is_verified()
  and exists (select 1 from places p where p.id = place_id and p.community_id = my_community()));

create policy "meus bloqueios" on public.blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy "denunciar" on public.reports for insert
  with check (reporter_id = auth.uid() and community_id = my_community());
create policy "ver denúncias" on public.reports for select
  using (reporter_id = auth.uid() or (is_moderator() and community_id = my_community()));
create policy "moderar denúncias" on public.reports for update using (is_moderator() and community_id = my_community());

-- Convites iniciais da equipe fundadora (troque por códigos reais antes do lançamento).
insert into public.invites (code, community_id, max_uses) values ('FUNDADORES', 'mackenzie', 50);
