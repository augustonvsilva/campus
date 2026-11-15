-- Campus: exclusão da própria conta (LGPD, art. 18, e exigência da App Store e da Google Play).
--
-- Fluxo (Edge Function `excluir-conta`, com service role):
--   1. prepare_account_deletion(usuário): resolve o que impediria a exclusão em cascata.
--   2. Apaga os arquivos do usuário no Storage (fotos, comprovantes), pela API do Storage.
--   3. auth.admin.deleteUser(usuário): apaga auth.users, e o perfil sai em cascata,
--      levando publicações, comentários, curtidas, Bora?, conexões, e-mail institucional etc.

-- Quem revisou denúncias ou verificações pode sair sem apagar o histórico da moderação.
alter table public.verification_requests drop constraint verification_requests_reviewed_by_fkey,
  add constraint verification_requests_reviewed_by_fkey foreign key (reviewed_by) references public.profiles on delete set null;
alter table public.reports drop constraint reports_resolved_by_fkey,
  add constraint reports_resolved_by_fkey foreign key (resolved_by) references public.profiles on delete set null;

-- Comunidades em que o usuário é o único admin: o membro mais antigo vira admin.
-- Sem outros membros, a comunidade é apagada (com mural, agenda e saídas).
create or replace function public.prepare_account_deletion(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  g record;
  v_next uuid;
begin
  for g in
    select gm.group_id from group_members gm
     where gm.user_id = p_user and gm.role = 'admin'
       and not exists (select 1 from group_members o
                        where o.group_id = gm.group_id and o.role = 'admin' and o.user_id <> p_user)
  loop
    select user_id into v_next from group_members
     where group_id = g.group_id and user_id <> p_user
     order by joined_at limit 1;
    if v_next is null then
      delete from groups where id = g.group_id;
    else
      update group_members set role = 'admin' where group_id = g.group_id and user_id = v_next;
    end if;
  end loop;
end $$;

revoke execute on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
