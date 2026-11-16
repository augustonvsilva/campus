-- PUC-SP: comunidade cadastrada e DORMINDO.
--
-- Pode rodar a qualquer momento: com is_active = false a comunidade não aparece para ninguém
-- (a política "comunidades ativas são públicas" esconde) e, sem convites, ninguém consegue
-- entrar nela (o cadastro exige um convite ligado à comunidade).
--
-- Para ACORDAR no lançamento:
--   1) update public.communities set is_active = true where id = 'puc-sp';
--   2) insert into public.invites (code, community_id, max_uses)
--        values ('PUC-FUNDADORES', 'puc-sp', 50);   -- convite inicial (ajuste o limite)
--   3) no app: status 'ativa' em src/lib/community.ts e EXPO_PUBLIC_COMMUNITY=puc-sp no build
--      (ou um build próprio para a PUC).
--
-- TODO: confirmar com a instituição os domínios de e-mail usados por alunos.

insert into public.communities (id, name, short_name, city, email_domains, is_active)
values ('puc-sp', 'Pontifícia Universidade Católica de São Paulo', 'PUC-SP', 'São Paulo',
        array['pucsp.edu.br'], false)
on conflict (id) do nothing;
