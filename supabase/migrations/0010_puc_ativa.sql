-- PUC-SP ativa: aparece no app (escolha na tela de entrada) e recebe o convite dos fundadores.
-- Rode depois da 0009. Pode rodar de novo sem erro.

update public.communities set is_active = true where id = 'puc-sp';

-- Convite inicial da PUC-SP (ajuste o limite). Os próximos, os próprios alunos geram no app.
insert into public.invites (code, community_id, max_uses)
values ('PUC-FUNDADORES', 'puc-sp', 50)
on conflict (code) do nothing;
