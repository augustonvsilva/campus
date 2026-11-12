-- Conteúdo inicial da comunidade Mackenzie (exemplos FICTÍCIOS).
-- Antes do lançamento, a equipe de Comunidade deve substituir por lugares e eventos reais,
-- já verificados (horário e endereço). Rode no SQL Editor do Supabase.

insert into public.places (community_id, name, category, address, price_range, hours, verified) values
  ('mackenzie', 'Boteco da Esquina',      'bar',         'A 3 min do portão principal (exemplo)', 2, 'seg–sáb, 17h–1h',  true),
  ('mackenzie', 'Café Página Dois',       'cafe',        'Praça em frente ao campus (exemplo)',   2, 'seg–sex, 7h–20h',  true),
  ('mackenzie', 'PF da Dona Lu',          'restaurante', 'Rua lateral ao campus (exemplo)',       1, null,               false),
  ('mackenzie', 'Sala de Estudos 24h',    'estudo',      'A 8 min a pé (exemplo)',                2, 'todos os dias, 24h', true),
  ('mackenzie', 'Bar do Placar',          'bar',         'A 5 min do campus (exemplo)',           2, null,               false),
  ('mackenzie', 'Lanchonete Ponto Final', 'restaurante', 'Ao lado do ponto de ônibus (exemplo)',  1, null,               false),
  ('mackenzie', 'Cantina do Largo',       'restaurante', 'A 10 min a pé (exemplo)',               3, 'ter–dom, 12h–23h', true);

insert into public.events (community_id, title, category, starts_at, ends_at, location, description, organizer, ticket_url, sponsored) values
  ('mackenzie', 'Futsal: Engenharia x Direito', 'jogo',
    date_trunc('day', now()) + interval '1 day 19 hours', date_trunc('day', now()) + interval '1 day 21 hours',
    'Ginásio', 'Rodada do campeonato interno. Entrada gratuita.', 'Atlética de Engenharia (exemplo)', null, false),
  ('mackenzie', 'Sarau no Gramado', 'cultura',
    date_trunc('day', now()) + interval '2 days 17 hours', date_trunc('day', now()) + interval '2 days 20 hours',
    'Gramado central', 'Microfone aberto para poesia, música e leitura.', 'Coletivo de Letras (exemplo)', null, false),
  ('mackenzie', 'Workshop: Portfólio que Contrata', 'academico',
    date_trunc('day', now()) + interval '3 days 10 hours', date_trunc('day', now()) + interval '3 days 12 hours',
    'Auditório (exemplo)', 'Como montar um portfólio enxuto para estágio.', 'Núcleo de Carreiras (exemplo)', null, false),
  ('mackenzie', 'Calourada de Fim de Ano', 'festa',
    date_trunc('day', now()) + interval '5 days 22 hours', date_trunc('day', now()) + interval '6 days 4 hours',
    'Casa de eventos (exemplo)', 'Festa de encerramento do semestre. Proibido para menores de 18 anos.',
    'Atléticas reunidas (exemplo)', 'https://example.com/ingressos', true);

-- Para tornar alguém moderador (depois que a pessoa criar a conta):
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'pessoa@mackenzista.com.br');
