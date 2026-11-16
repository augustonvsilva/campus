-- PUC-SP: comunidade cadastrada e DORMINDO.
--
-- Pode rodar a qualquer momento: com is_active = false a comunidade não aparece para ninguém
-- (a política "comunidades ativas são públicas" esconde) e, sem convites, ninguém consegue
-- entrar nela (o cadastro exige um convite ligado à comunidade).
--
-- Para ACORDAR: rode a 0010_puc_ativa.sql (liga a comunidade e cria o convite PUC-FUNDADORES).
--
-- TODO: confirmar com a instituição os domínios de e-mail usados por alunos.

insert into public.communities (id, name, short_name, city, email_domains, is_active)
values ('puc-sp', 'Pontifícia Universidade Católica de São Paulo', 'PUC-SP', 'São Paulo',
        array['pucsp.edu.br'], false)
on conflict (id) do nothing;
