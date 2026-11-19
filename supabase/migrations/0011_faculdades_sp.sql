-- Faculdades famosas da cidade de São Paulo (16), já ATIVAS, cada uma com o convite <PREFIXO>-FUNDADORES.
-- Pode rodar de novo sem erro (não religa quem foi desligado). Para desligar uma: update public.communities set is_active = false where id = '<id>';
-- TODO: confirmar com cada instituição os domínios de e-mail usados por alunos.

insert into public.communities (id, name, short_name, city, email_domains, is_active) values
  ('usp', 'Universidade de São Paulo', 'USP', 'São Paulo', array['usp.br'], true),
  ('fgv', 'Fundação Getulio Vargas', 'FGV', 'São Paulo', array['fgv.edu.br'], true),
  ('insper', 'Insper Instituto de Ensino e Pesquisa', 'Insper', 'São Paulo', array['al.insper.edu.br'], true),
  ('espm', 'Escola Superior de Propaganda e Marketing', 'ESPM', 'São Paulo', array['acad.espm.br'], true),
  ('faap', 'Fundação Armando Alvares Penteado', 'FAAP', 'São Paulo', array['faap.net'], true),
  ('unifesp', 'Universidade Federal de São Paulo', 'Unifesp', 'São Paulo', array['unifesp.br'], true),
  ('casper', 'Faculdade Cásper Líbero', 'Cásper Líbero', 'São Paulo', array['al.casperlibero.edu.br'], true),
  ('anhembi', 'Universidade Anhembi Morumbi', 'Anhembi Morumbi', 'São Paulo', '{}'::text[], true),
  ('sao-judas', 'Universidade São Judas Tadeu', 'São Judas', 'São Paulo', '{}'::text[], true),
  ('uninove', 'Universidade Nove de Julho', 'Uninove', 'São Paulo', array['uninove.edu.br'], true),
  ('belas-artes', 'Centro Universitário Belas Artes de São Paulo', 'Belas Artes', 'São Paulo', array['belasartes.edu.br'], true),
  ('fecap', 'Fundação Escola de Comércio Álvares Penteado', 'FECAP', 'São Paulo', array['edu.fecap.br'], true),
  ('senac', 'Centro Universitário Senac', 'Senac', 'São Paulo', array['senacsp.edu.br'], true),
  ('cruzeiro-do-sul', 'Universidade Cruzeiro do Sul', 'Cruzeiro do Sul', 'São Paulo', array['cs.cruzeirodosul.edu.br'], true),
  ('unip', 'Universidade Paulista', 'UNIP', 'São Paulo', array['aluno.unip.br'], true),
  ('fiap', 'Faculdade de Informática e Administração Paulista', 'FIAP', 'São Paulo', array['fiap.com.br'], true)
on conflict (id) do nothing;

-- Convites iniciais (ajuste os limites). Os próximos, os próprios alunos geram no app.
insert into public.invites (code, community_id, max_uses) values
  ('USP-FUNDADORES', 'usp', 50),
  ('FGV-FUNDADORES', 'fgv', 50),
  ('INSP-FUNDADORES', 'insper', 50),
  ('ESPM-FUNDADORES', 'espm', 50),
  ('FAAP-FUNDADORES', 'faap', 50),
  ('UNIF-FUNDADORES', 'unifesp', 50),
  ('CASP-FUNDADORES', 'casper', 50),
  ('UAM-FUNDADORES', 'anhembi', 50),
  ('USJT-FUNDADORES', 'sao-judas', 50),
  ('NOVE-FUNDADORES', 'uninove', 50),
  ('BELAS-FUNDADORES', 'belas-artes', 50),
  ('FECAP-FUNDADORES', 'fecap', 50),
  ('SENAC-FUNDADORES', 'senac', 50),
  ('CSUL-FUNDADORES', 'cruzeiro-do-sul', 50),
  ('UNIP-FUNDADORES', 'unip', 50),
  ('FIAP-FUNDADORES', 'fiap', 50)
on conflict (code) do nothing;
