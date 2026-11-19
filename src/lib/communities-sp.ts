import type { Community } from './types';

// Faculdades famosas da cidade de São Paulo, cadastradas em 19/11/2026. No banco: migration 0011.
// Cursos: graduação presencial nas unidades da capital, conforme o site de cada instituição (fonte e
// data no comentário). Campi: só os da cidade de São Paulo. Domínios de e-mail: a confirmar com cada
// instituição. Fotos: Wikimedia Commons, com licença que permite o uso (crédito aparece no app).

// Cursos cujo 'Onde estudar' em www5.usp.br/ensino/graduacao aponta unidade na cidade de São Paulo (Butantã,
// Quadrilátero da Saúde, Largo São Francisco e EACH/USP Leste). Habilitações, ênfases, bacharelado/licenciatura e
// turnos entram no curso principal (ex.: Letras com todas as habilitações; Música com todos os instrumentos;
// Engenharia Elétrica com todas as ênfases). 'Educação Física e Esporte' (EEFE, Butantã) e 'Educação Física e Saúde'
// (EACH) ficam separados por serem cursos distintos. Biotecnologia (EACH), Design (FAU) e Oceanografia (Instituto
// Oceanográfico) não tinham '/ São Paulo' na entrada, mas as unidades ficam na capital. Excluídos: Engenharia de
// Petróleo (Escola Politécnica, mas ministrada no campus de Santos) e os cursos de Ribeirão Preto, São Carlos,
// Piracicaba, Bauru, Lorena e Pirassununga. Sem EAD (a USP não tem graduação EAD regular). Cursos:
// https://www5.usp.br/ensino/graduacao/ (consultado em 19/11/2026). Campi: https://www5.usp.br/ensino/graduacao/
// (seção 'Onde estudar' de cada curso; endereço do Butantã no rodapé da página).
export const USP: Community = {
  id: 'usp',
  name: 'Universidade de São Paulo',
  shortName: 'USP',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'USP',
  mainCampus: 'Cidade Universitária Armando de Salles Oliveira (Butantã)',
  campuses: [
    { name: 'Cidade Universitária Armando de Salles Oliveira (Butantã)', address: 'R. da Reitoria, 374 – Butantã' },
    { name: 'Quadrilátero da Saúde (Cerqueira César)', address: 'Av. Dr. Arnaldo, 455 – Cerqueira César' },
    { name: 'Faculdade de Direito (Largo São Francisco)', address: 'Largo São Francisco, 95 – Sé' },
    { name: 'EACH – USP Leste', address: 'R. Arlindo Béttio, 1000 – Ermelino Matarazzo' },
  ],
  // TODO: confirmar com a instituição. Alta: alunos de graduação recebem e-mail institucional @usp.br
  // (nome.sobrenome@usp.br), o mesmo domínio de docentes/servidores. Não há subdomínio só de alunos.
  emailDomains: ['usp.br'],
  courses: [
    'Administração', 'Arquitetura e Urbanismo', 'Artes Cênicas', 'Artes Visuais', 'Astronomia', 'Audiovisual',
    'Biblioteconomia e Ciência da Informação', 'Biotecnologia', 'Ciência da Computação', 'Ciências Atuariais',
    'Ciências Biológicas', 'Ciências Biomédicas', 'Ciências Contábeis', 'Ciências Econômicas', 'Ciências Sociais',
    'Ciências da Natureza', 'Design', 'Direito', 'Editoração', 'Educação Física e Esporte',
    'Educação Física e Saúde', 'Educomunicação', 'Enfermagem', 'Engenharia Ambiental', 'Engenharia Civil',
    'Engenharia Elétrica', 'Engenharia Mecatrônica', 'Engenharia Mecânica', 'Engenharia Metalúrgica',
    'Engenharia Naval', 'Engenharia Química', 'Engenharia de Computação', 'Engenharia de Materiais',
    'Engenharia de Minas', 'Engenharia de Produção', 'Estatística', 'Farmácia', 'Filosofia', 'Fisioterapia',
    'Fonoaudiologia', 'Física', 'Geociências e Educação Ambiental', 'Geofísica', 'Geografia', 'Geologia',
    'Gerontologia', 'Gestão Ambiental', 'Gestão de Políticas Públicas', 'História', 'Jornalismo', 'Lazer e Turismo',
    'Letras', 'Marketing', 'Matemática', 'Matemática Aplicada', 'Matemática Aplicada e Computacional', 'Medicina',
    'Medicina Veterinária', 'Meteorologia', 'Música', 'Nutrição', 'Obstetrícia', 'Oceanografia', 'Odontologia',
    'Pedagogia', 'Psicologia', 'Publicidade e Propaganda', 'Química', 'Relações Internacionais',
    'Relações Públicas', 'Saúde Pública', 'Sistemas de Informação', 'Terapia Ocupacional', 'Turismo',
    'Têxtil e Moda',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['USP2026', 'FUNDADORES'],
  cover: {
    source: require('../../assets/campus/usp.jpg'),
    sourceWide: require('../../assets/campus/usp-largo.jpg'),
    author: 'Mike Peel (www.mikepeel.net)',
    license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:At_the_University_of_S%C3%A3o_Paulo_2017_060.jpg',
    place: 'Torre do Relógio, Praça do Relógio – Cidade Universitária',
  },
};

// Apenas os 5 cursos que o Vestibular FGV lista em /cursos/sao-paulo/: Administração de Empresas e Administração
// Pública (FGV EAESP), Direito (FGV Direito SP), Economia (FGV EESP) e Relações Internacionais. Matemática Aplicada
// (EMAp), Ciência de Dados e IA, Ciências Sociais, Comunicação Digital, Economia e Finanças etc. são só no Rio de
// Janeiro; Brasília tem Administração e Administração Pública. Sem EAD de graduação. Cursos:
// https://vestibular.fgv.br/ (consultado em 19/11/2026). Campi: https://eaesp.fgv.br/contato ;
// https://direitosp.fgv.br/ (rodapé) ; https://eesp.fgv.br/ (rodapé).
export const FGV: Community = {
  id: 'fgv',
  name: 'Fundação Getulio Vargas',
  shortName: 'FGV',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'FGV',
  mainCampus: 'FGV São Paulo – Av. Nove de Julho (Bela Vista)',
  campuses: [
    { name: 'FGV São Paulo – Av. Nove de Julho (Bela Vista)', address: 'Av. Nove de Julho, 2029 – Bela Vista' },
    { name: 'FGV São Paulo – Rua Dr. Plínio Barreto (Bela Vista)', address: 'R. Dr. Plínio Barreto, 365 – Bela Vista' },
  ],
  // TODO: confirmar com a instituição. Alta: a TIC-FGV (alunos.tic.fgv.br, página 'FGV Student Identification
  // Accounts') diz que o aluno recebe a conta Office 365 A12345@fgv.edu.br e o alias nome.sobrenome@fgv.edu.br.
  // fgv.br é de funcionários e professores e ficou de fora.
  emailDomains: ['fgv.edu.br'],
  courses: [
    'Administração Pública', 'Administração de Empresas', 'Direito', 'Economia', 'Relações Internacionais',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['FGV2026', 'FUNDADORES'],
  cover: {
    source: require('../../assets/campus/fgv.jpg'),
    sourceWide: require('../../assets/campus/fgv-largo.jpg'),
    author: 'Dornicke',
    license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:FGV_-_Escola_de_Direito_SP.jpg',
    place: 'FGV Direito SP, Rua Rocha – Bela Vista',
  },
};

// O site do Insper devolveu 403 para acesso automatizado. A lista foi montada a partir das páginas oficiais de cada
// curso que aparecem na busca (insper.edu.br/pt/cursos/graduacao/...: administracao, ciencia-da-computacao,
// economia, direito, engenharia/engenharia-de-computacao, engenharia/engenharia-mecanica,
// engenharia/engenharia-mecatronica, engenharia/engenharia-de-producao) e conferida com o resumo do edital do
// Vestibular Insper 2027 (Estratégia Vestibulares), que lista os mesmos 8 cursos. Engenharia de Produção é a mais
// nova. Sem EAD. Cursos: https://www.insper.edu.br/pt/cursos/graduacao (consultado em 19/11/2026). Campi:
// https://www.insper.edu.br/en/campus.
export const INSPER: Community = {
  id: 'insper',
  name: 'Insper Instituto de Ensino e Pesquisa',
  shortName: 'Insper',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'INSP',
  mainCampus: 'Campus Insper (Vila Olímpia)',
  campuses: [
    { name: 'Campus Insper (Vila Olímpia)', address: 'R. Quatá, 300 – Vila Olímpia' },
  ],
  // TODO: confirmar com a instituição. Média: alunos usam @al.insper.edu.br (achado em CV público de aluno; padrão
  // conhecido). Professores e funcionários usam @insper.edu.br; aceitar insper.edu.br também deixaria entrar
  // funcionários. Não foi possível confirmar no site oficial, que bloqueia acesso automatizado.
  emailDomains: ['al.insper.edu.br'],
  courses: [
    'Administração', 'Ciência da Computação', 'Ciências Econômicas', 'Direito', 'Engenharia Mecatrônica',
    'Engenharia Mecânica', 'Engenharia de Computação', 'Engenharia de Produção',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['INSP2026', 'FUNDADORES'],
  cover: {
    source: require('../../assets/campus/insper.jpg'),
    sourceWide: require('../../assets/campus/insper-largo.jpg'),
    author: 'Lister Ogusuku Ribeiro',
    license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:C%C3%A2mpus_Insper_-_Pr%C3%A9dio_1.jpg',
    place: 'Prédio 1, Rua Quatá, 300 – Vila Olímpia',
  },
};

// Bacharelados da seção São Paulo (#sp) de espm.br/cursos-de-graduacao e os 4 tecnólogos presenciais noturnos que as
// páginas espm.br/cursos/tecnologo/* listam em São Paulo (Campus Álvaro Alvim), com sufixo "(Tecnólogo)" como em
// Mackenzie. Fora: cursos só do Rio (Business and Economics / Administração+Economia, Ciência de Dados & IA) e as
// ofertas EAD dos tecnólogos (polos no Rio e em Porto Alegre, não em SP). A ESPM | Panamericana (Av. Angélica, 1900)
// não oferece graduação e ficou fora de campuses. Cursos: https://www.espm.br/cursos-de-graduacao/ (consultado em
// 19/11/2026). Campi: https://www.espm.br/blog/espm-sao-paulo-conheca-as-unidades/ e
// https://www.espm.br/sobre-a-espm/nossos-campi/campus-alvaro-alvim/.
export const ESPM: Community = {
  id: 'espm',
  name: 'Escola Superior de Propaganda e Marketing',
  shortName: 'ESPM',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'ESPM',
  mainCampus: 'Campus Álvaro Alvim',
  campuses: [
    { name: 'Campus Álvaro Alvim', address: 'Rua Dr. Álvaro Alvim, 123 – Vila Mariana' },
    { name: 'ESPM Tech', address: 'Rua Joaquim Távora, 1240 – Vila Mariana' },
  ],
  // TODO: confirmar com a instituição. Alta para acad.espm.br: a Política de Privacidade da ESPM
  // (espm.br/politica-de-privacidade) lista @espm.br, @acad.espm.br e @espm.edu.br como domínios oficiais, e o FAQ
  // Alumni da ESPM fala em "meu e-mail @acad.espm.br" (conta do estudante); o domínio tem MX próprio no Microsoft
  // 365. @espm.br é de funcionários/professores (não incluído); @espm.edu.br tem uso incerto (não incluído).
  emailDomains: ['acad.espm.br'],
  courses: [
    'Administração', 'Cinema e Audiovisual', 'Ciência de Dados e Negócios', 'Ciências Sociais e do Consumo',
    'Comunicação e Publicidade', 'Design', 'Direito', 'Gestão Comercial (Tecnólogo)',
    'Gestão da Qualidade (Tecnólogo)', 'Gestão de Recursos Humanos (Tecnólogo)', 'Jornalismo',
    'Logística (Tecnólogo)', 'Relações Internacionais',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['ESPM2026', 'FUNDADORES'],
};

// Os 18 cursos de faap.br/graduacao, todos presenciais; sem EAD. A página não separa por unidade; a FAAP também tem
// unidade em Ribeirão Preto (Rua Marcelo Sarti, 100), sem distinção de oferta ali. Business and International
// Affairs e Business Communication and Media são programas de dupla/tripla titulação que o site lista como cursos
// próprios, por isso foram mantidos. Cursos: https://www.faap.br/graduacao/ (consultado em 19/11/2026). Campi:
// https://www.faap.br/graduacao/ (rodapé: "São Paulo | Rua Alagoas, 903 - Higienópolis"). O site chama o local
// apenas de "Campus FAAP"; "Campus Higienópolis" é o nome descritivo pelo bairro..
export const FAAP: Community = {
  id: 'faap',
  name: 'Fundação Armando Alvares Penteado',
  shortName: 'FAAP',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'FAAP',
  mainCampus: 'Campus Higienópolis',
  campuses: [
    { name: 'Campus Higienópolis', address: 'Rua Alagoas, 903 – Higienópolis' },
  ],
  // TODO: confirmar com a instituição. Média para faap.net: o Manual do Aluno FAAP 2024
  // (https://www2.faap.br/wp-content/uploads/2024/03/FAAP_manual_do_aluno_2024.pdf) diz "Para acessar o e-mail FAAP,
  // o aluno deve entrar no site www.faap.net e habilitar sua conta", e faap.net tem MX próprio no Microsoft 365,
  // separado de faap.br. Nenhuma fonte oficial mostra literalmente um endereço "@faap.net" de aluno. faap.br é usado
  // por professores/setores; incluí-lo também é uma opção se a confirmação falhar.
  emailDomains: ['faap.net'],
  courses: [
    'Administração', 'Animação', 'Arquitetura e Urbanismo', 'Artes Visuais', 'Business Communication and Media',
    'Business and International Affairs', 'Cinema', 'Design', 'Direito', 'Economia',
    'Inteligência Artificial Aplicada', 'Jogos Digitais', 'Jornalismo', 'Moda', 'Produção Audiovisual',
    'Publicidade e Propaganda', 'Relações Internacionais', 'Relações Públicas',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['FAAP2026', 'FUNDADORES'],
  cover: {
    source: require('../../assets/campus/faap.jpg'),
    sourceWide: require('../../assets/campus/faap-largo.jpg'),
    author: 'Beatriz Liet',
    license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:Museu_de_Arte_Brasileira_da_Funda%C3%A7%C3%A3o_Armando_%C3%81lvares_Penteado.jpg',
    place: 'Prédio principal (Museu de Arte Brasileira), Campus Higienópolis',
  },
};

// Somente campi na cidade de São Paulo: Campus São Paulo (Vila Clementino) e Campus Zona Leste (Itaquera). Turnos e
// grau unificados (Geografia bacharelado/licenciatura em vários turnos vira "Geografia"). Tecnólogos com sufixo
// "(Tecnólogo)". Fora: Guarulhos, Diadema, Osasco, Baixada Santista e São José dos Campos; fora também o Tecnólogo
// em Design Educacional (EAD, ~30 vagas, vinculado ao Campus São Paulo), por não ser oferta presencial
// significativa. Cursos: https://ingresso.unifesp.br/cursos-de-graduacao (dados da API oficial
// https://sistemas.unifesp.br/api/v2/graduacao/cursos) (consultado em 19/11/2026). Campi:
// https://sistemas.unifesp.br/api/v2/graduacao/cursos (campo DESCRICAO = campus de cada curso); endereço da Zona
// Leste conforme editais em unifesp.br/campus/zonaleste; Campus São Paulo = sede da Escola Paulista de Medicina (Rua
// Botucatu, 740)..
export const UNIFESP: Community = {
  id: 'unifesp',
  name: 'Universidade Federal de São Paulo',
  shortName: 'Unifesp',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'UNIF',
  mainCampus: 'Campus São Paulo',
  campuses: [
    { name: 'Campus São Paulo', address: 'Rua Botucatu, 740 – Vila Clementino' },
    { name: 'Campus Zona Leste', address: 'Av. Jacu-Pêssego, 2630 – Itaquera' },
  ],
  // TODO: confirmar com a instituição. Média-alta: a Unifesp usa @unifesp.br (Google Workspace, MX
  // aspmx.l.google.com) para alunos, docentes e servidores (formato comum nome.sobrenome@unifesp.br). Não há
  // subdomínio de aluno (aluno.unifesp.br não tem MX). Não consegui uma página oficial confirmando o formato do
  // aluno: unifesp.br retornava 502/403 na consulta.
  emailDomains: ['unifesp.br'],
  courses: [
    'Arquitetura e Urbanismo', 'Biomedicina', 'Enfermagem', 'Fonoaudiologia', 'Geografia',
    'Informática em Saúde (Tecnólogo)', 'Medicina', 'Radiologia (Tecnólogo)', 'Tecnologia Oftálmica (Tecnólogo)',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['UNIF2026', 'FUNDADORES'],
  cover: {
    source: require('../../assets/campus/unifesp.jpg'),
    sourceWide: require('../../assets/campus/unifesp-largo.jpg'),
    author: 'Alex Reipert',
    license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:Campus_S%C3%A3o_Paulo_da_Unifesp.jpg',
    place: 'Escola Paulista de Medicina, Campus São Paulo',
  },
};

// Os 4 bacharelados presenciais listados em casperlibero.edu.br/graduacao (todos na Av. Paulista, 900).
// "Audiovisual" é o antigo "Rádio, TV e Internet" (o nome antigo ainda aparece em links do site). A Cásper não tem
// graduação EAD. A instituição não dá nome de campus; "Edifício Gazeta" é o prédio da Fundação Cásper Líbero onde a
// faculdade funciona (o site diz apenas "Av. Paulista, 900"). Cursos: https://casperlibero.edu.br/graduacao/
// (consultado em 19/11/2026). Campi: https://casperlibero.edu.br/.
export const CASPER: Community = {
  id: 'casper',
  name: 'Faculdade Cásper Líbero',
  shortName: 'Cásper Líbero',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'CASP',
  mainCampus: 'Edifício Gazeta',
  campuses: [
    { name: 'Edifício Gazeta', address: 'Av. Paulista, 900 – Bela Vista' },
  ],
  // TODO: confirmar com a instituição. Alta para al.casperlibero.edu.br: o manual oficial de primeiro acesso ao
  // Teams (static.casperlibero.edu.br/uploads/2022/02/Manual-Primeiro-Acesso-Teams-2022.pdf) manda o aluno entrar
  // com o "e-mail acadêmico @al.casperlibero.edu.br". O documento é de 2022; não achei confirmação mais recente.
  // casperlibero.edu.br (sem "al.") é usado por funcionários/setores (faculdade@, vestibular@), não por alunos, por
  // isso ficou de fora.
  emailDomains: ['al.casperlibero.edu.br'],
  courses: [
    'Audiovisual', 'Jornalismo', 'Publicidade e Propaganda', 'Relações Públicas',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['CASP2026', 'FUNDADORES'],
  cover: {
    source: require('../../assets/campus/casper.jpg'),
    sourceWide: require('../../assets/campus/casper-largo.jpg'),
    author: 'andre savastano',
    license: 'CC BY-SA 2.0',
    url: 'https://commons.wikimedia.org/wiki/File:Edif%C3%ADcio_Gazeta_(5701845511).jpg',
    place: 'Letreiro do Edifício Gazeta, Av. Paulista',
  },
};

// Incluídos só cursos com oferta Presencial ou Semipresencial nas unidades próprias da cidade de São Paulo (Mooca,
// Paulista, Vila Olímpia), conforme as ofertas publicadas em cada página de curso. Excluídos: cursos só EAD;
// semipresenciais oferecidos apenas em polos parceiros (Campinas, Ribeirão Preto etc.); cursos só em Piracicaba,
// Sorocaba ou São José dos Campos (ex.: Odontologia, Estética e Cosmética tecnólogo). Variantes juntadas: ADS e "ADS
// com Oracle Academy"; Gastronomia bacharelado e tecnólogo (Le Cordon Bleu); Marketing bacharelado e tecnólogo;
// "Direito com Opice Blum" virou Direito. Comércio Exterior (tecnólogo) e Comércio Internacional (bacharelado) são
// cursos diferentes e ficaram separados. Medicina (Mooca) vem do site separado medicina.anhembi.edu.br. O site é
// renderizado em JS (Nuxt); os dados foram lidos dos _payload.json públicos das páginas. Cursos:
// https://portal.anhembi.br/cursos/graduacao/ (lista completa via https://portal.anhembi.br/sitemap.xml + dados de
// oferta de cada página de curso); Medicina: https://medicina.anhembi.edu.br/ (consultado em 19/11/2026). Campi:
// https://portal.anhembi.br/unidades/ (unidades em São Paulo: Mooca, Paulista, Vila Olímpia); cursos por unidade
// conforme as ofertas de cada página https://portal.anhembi.br/cursos/graduacao/<curso>/.
export const ANHEMBI: Community = {
  id: 'anhembi',
  name: 'Universidade Anhembi Morumbi',
  shortName: 'Anhembi Morumbi',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'UAM',
  mainCampus: 'Unidade Mooca',
  campuses: [
    { name: 'Unidade Mooca', address: 'Rua Dr. Almeida Lima, 1.134 – Mooca' },
    { name: 'Unidade Paulista', address: 'Avenida Paulista, 2000 – Bela Vista' },
    { name: 'Unidade Vila Olímpia', address: 'Rua Casa do Ator, 294 – Vila Olímpia' },
  ],
  // TODO: confirmar com a instituição. Sem domínio próprio: alunos usam @ulife.com.br, comum a todo o grupo Ânima
  // (não distingue a instituição). Verificação só por comprovante.
  emailDomains: [],
  courses: [
    'Administração', 'Análise e Desenvolvimento de Sistemas', 'Arquitetura e Urbanismo', 'Aviação Civil',
    'Biomedicina', 'Cinema e Audiovisual', 'Ciência da Computação', 'Ciência de Dados', 'Ciências Biológicas',
    'Ciências Contábeis', 'Ciências Econômicas', 'Comissário de Voo', 'Comércio Exterior', 'Comércio Internacional',
    'Dança', 'Design Digital', 'Design Gráfico', 'Design de Animação', 'Design de Games', 'Design de Interiores',
    'Design de Moda', 'Direito', 'Educação Física', 'Enfermagem', 'Engenharia Civil', 'Engenharia Elétrica',
    'Engenharia Mecânica', 'Engenharia da Computação', 'Engenharia de Produção', 'Engenharia de Software',
    'Estética', 'Farmácia', 'Fisioterapia', 'Fonoaudiologia', 'Gastronomia', 'Gestão Financeira',
    'Gestão de Recursos Humanos', 'Inteligência Artificial', 'Jornalismo', 'Logística', 'Manutenção de Aeronaves',
    'Marketing', 'Medicina', 'Medicina Veterinária', 'Negócios da Moda', 'Nutrição', 'Pedagogia',
    'Processos Gerenciais', 'Produção Fonográfica', 'Psicologia', 'Publicidade e Propaganda', 'Quiropraxia',
    'Relações Internacionais', 'Relações Públicas', 'Rádio, TV e Internet', 'Sistemas de Informação', 'Teatro',
    'Terapia Ocupacional', 'Turismo',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['UAM2026', 'FUNDADORES'],
  cover: {
    source: require('../../assets/campus/anhembi.jpg'),
    sourceWide: require('../../assets/campus/anhembi-largo.jpg'),
    author: 'Marcio.andrade83',
    license: 'CC0',
    url: 'https://commons.wikimedia.org/wiki/File:BIBLIOTECA_DA_UNIVERSIDADE_ANHEMBI_MORUMBI_-_CAMPUS_MOOCA.jpg',
    place: 'Biblioteca, Unidade Mooca',
  },
};

// Incluídos só cursos com oferta Presencial ou Semipresencial nas unidades próprias da cidade de São Paulo (Mooca,
// Butantã, Paulista, Santana, Santo Amaro, Vila Leopoldina). Excluídos: cursos só EAD; semipresenciais oferecidos
// apenas em polos parceiros (inclusive polos dentro da capital, como Gestão Hospitalar, Serviço Social,
// licenciaturas de Química/Física/História etc.); cursos só em Cubatão/Unimonte/Guarulhos/São Bernardo (ex.:
// Gastronomia, Estética e Cosmética). Medicina da São Judas fica em Cubatão (fora da capital) e não entrou.
// Variantes juntadas: Educação Física bacharelado e licenciatura. O site é renderizado em JS (Nuxt); os dados foram
// lidos dos _payload.json públicos das páginas. A página de Matemática (licenciatura) deu 404. Cursos:
// https://www.usjt.br/cursos/graduacao/ (lista completa via https://www.usjt.br/sitemap.xml + dados de oferta de
// cada página de curso) (consultado em 19/11/2026). Campi: https://www.usjt.br/unidades/ (unidades na cidade de São
// Paulo: Mooca, Butantã, Paulista, Santana, Santo Amaro, Vila Leopoldina); cursos por unidade conforme as ofertas de
// cada página https://www.usjt.br/cursos/graduacao/<curso>/.
export const SAO_JUDAS: Community = {
  id: 'sao-judas',
  name: 'Universidade São Judas Tadeu',
  shortName: 'São Judas',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'USJT',
  mainCampus: 'Unidade Mooca',
  campuses: [
    { name: 'Unidade Mooca', address: 'Rua Taquari, 546 – Mooca' },
    { name: 'Unidade Butantã', address: 'Avenida Vital Brasil, 1000 – Butantã' },
    { name: 'Unidade Paulista', address: 'Avenida Angélica, 2565 – Bela Vista' },
    { name: 'Unidade Santana', address: 'Rua Voluntários da Pátria, 2624 – Santana' },
    { name: 'Unidade Santo Amaro', address: 'Rua Alexandre Dumas, 2016 – Santo Amaro' },
    { name: 'Unidade Vila Leopoldina', address: 'Avenida Imperatriz Leopoldina, 112 – Vila Leopoldina' },
  ],
  // TODO: confirmar com a instituição. Sem domínio próprio: alunos usam @ulife.com.br, comum a todo o grupo Ânima
  // (não distingue a instituição). Verificação só por comprovante.
  emailDomains: [],
  courses: [
    'Administração', 'Análise e Desenvolvimento de Sistemas', 'Arquitetura e Urbanismo', 'Biomedicina',
    'Cinema e Audiovisual', 'Ciência da Computação', 'Ciências Biológicas', 'Ciências Contábeis',
    'Ciências Econômicas', 'Comércio Exterior', 'Design', 'Design Gráfico', 'Design de Interiores', 'Direito',
    'Educação Física', 'Enfermagem', 'Engenharia Biomédica', 'Engenharia Civil', 'Engenharia Elétrica',
    'Engenharia Mecânica', 'Engenharia Química', 'Engenharia da Computação', 'Engenharia de Controle e Automação',
    'Engenharia de Produção', 'Engenharia de Software', 'Farmácia', 'Filosofia', 'Fisioterapia', 'Fonoaudiologia',
    'Gestão Comercial', 'Gestão Financeira', 'Gestão de Recursos Humanos', 'Jornalismo', 'Letras - Português',
    'Marketing', 'Medicina Veterinária', 'Nutrição', 'Odontologia', 'Pedagogia', 'Psicologia',
    'Publicidade e Propaganda', 'Relações Internacionais', 'Relações Públicas', 'Segurança da Informação',
    'Sistemas de Informação', 'Terapia Ocupacional',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['USJT2026', 'FUNDADORES'],
  cover: {
    source: require('../../assets/campus/sao-judas.jpg'),
    sourceWide: require('../../assets/campus/sao-judas-largo.jpg'),
    author: 'Daniellima89',
    license: 'Domínio público',
    url: 'https://commons.wikimedia.org/wiki/File:SAOJUDAS.jpg',
    place: 'Rampas e prédios da Unidade Mooca',
  },
};

// Catálogo de graduação da Universidade (graduacao.uninove.br, uma página por curso com o campo 'Modalidade'), mais
// Medicina, que tem site próprio (https://medicina.uninove.br/, campus Vergueiro na capital). Entram os cursos com
// oferta presencial ou semipresencial; o semipresencial tem aulas no campus. Ficaram de fora os só EAD: Ciência de
// Dados, Eventos, Gastronomia, Gestão de Serviços Jurídicos, Gestão Pública, Hotelaria, Inteligência Artificial,
// Jogos Digitais, Secretariado, Sistemas para Internet e Turismo. Também ficou de fora Rádio e TV ('Aguarde
// inscrições', sem oferta aberta). As unidades de fora da capital (Bauru, Guarulhos, Mauá, Osasco, São Bernardo) são
// Faculdades Nove de Julho separadas e não entram. Juntei bacharelado e licenciatura (Ciências Biológicas, Educação
// Física) e tirei o prefixo 'Tecnologia em' dos tecnólogos. Ressalva: o site não diz em qual dos 5 campi da capital
// cada curso é dado. Isso só aparece para Direito e Engenharia Civil (nota do MEC nos 5 campi) e Medicina
// (Vergueiro), então pode haver curso que existe em só alguns campi. Cursos: https://graduacao.uninove.br/
// (consultado em 19/11/2026). Campi: https://www.uninove.br/unidades (seção 'Campi São Paulo'); cursos por campus:
// notas do MEC por campus nas páginas de Direito e Engenharia Civil em graduacao.uninove.br, e
// https://medicina.uninove.br/ para Medicina.
export const UNINOVE: Community = {
  id: 'uninove',
  name: 'Universidade Nove de Julho',
  shortName: 'Uninove',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'NOVE',
  mainCampus: 'Campus Vergueiro',
  campuses: [
    { name: 'Campus Vergueiro', address: 'Rua Vergueiro, 235/249 – Liberdade' },
    { name: 'Campus Memorial', address: 'Av. Dr. Adolpho Pinto, 109 – Barra Funda' },
    { name: 'Campus Santo Amaro', address: 'Rua Amador Bueno, 389/491 – Santo Amaro' },
    { name: 'Campus Vila Prudente', address: 'Av. Prof. Luiz Ignácio Anhaia Mello, 1363 – Vila Prudente' },
    { name: 'Campus Vila Maria', address: 'Rua Guaranésia, 425 – Vila Maria' },
  ],
  // TODO: confirmar com a instituição. MÉDIA para uninove.edu.br: um guia do Quero Bolsa sobre o Office grátis para
  // alunos diz que é preciso 'uma conta de e-mail Uninove ativa (@uninove.edu.br)', e o domínio tem MX no Microsoft
  // 365. Não é fonte oficial. BAIXA para uni9.edu.br: o domínio existe e tem MX no Google Workspace, mas não achei
  // nenhuma fonte ligando ele a alunos. uninove.br é o domínio da instituição e dos funcionários e não foi incluído.
  // Confirmar com a Uninove.
  emailDomains: ['uninove.edu.br'],
  courses: [
    'Administração', 'Análise e Desenvolvimento de Sistemas', 'Arquitetura e Urbanismo', 'Banco de Dados',
    'Biomedicina', 'Ciência da Computação', 'Ciências Biológicas', 'Ciências Contábeis', 'Ciências Econômicas',
    'Ciências Sociais', 'Comércio Exterior', 'Design', 'Design Gráfico', 'Direito', 'Educação Especial',
    'Educação Física', 'Enfermagem', 'Engenharia Civil', 'Engenharia Elétrica', 'Engenharia Mecânica',
    'Engenharia de Produção', 'Estética e Cosmética', 'Farmácia', 'Fisioterapia', 'Gestão Comercial',
    'Gestão Financeira', 'Gestão da Qualidade', 'Gestão da Tecnologia da Informação', 'Gestão de Recursos Humanos',
    'História', 'Jornalismo', 'Letras - Inglês', 'Letras - Português', 'Logística', 'Marketing', 'Matemática',
    'Mecatrônica Industrial', 'Medicina', 'Medicina Veterinária', 'Nutrição', 'Odontologia', 'Pedagogia',
    'Processos Gerenciais', 'Produção Audiovisual', 'Psicologia', 'Publicidade e Propaganda', 'Química',
    'Radiologia', 'Redes de Computadores', 'Segurança da Informação', 'Serviço Social', 'Sistemas de Informação',
    'Tradutor e Intérprete',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['NOVE2026', 'FUNDADORES'],
  cover: {
    source: require('../../assets/campus/uninove.jpg'),
    sourceWide: require('../../assets/campus/uninove-largo.jpg'),
    author: 'CORRETOR-CARVALHO',
    license: 'CC BY-SA 3.0',
    url: 'https://commons.wikimedia.org/wiki/File:UNINOVE_-_Campus_Memorial_-_Avenida_Doutor_Adolpho_Pinto,_109_-_panoramio.jpg',
    place: 'Campus Memorial, Barra Funda',
  },
};

// Graduação presencial e semipresencial nos três campi da capital (Paraíso, Vila Mariana e Shopping Cidade Jardim).
// A página da matriz carrega os cursos aos poucos ('carregar mais'), então a lista completa saiu da API pública do
// próprio site (belasartes.br/wp-json/wp/v2/graduacao, com as taxonomias de campus e modalidade). Ficaram de fora os
// cursos só 'Online ao Vivo' (EAD): Comunicação Institucional, Eventos, Gestão de Recursos Humanos e Processos
// Gerenciais. Também ficaram de fora as ofertas do campus Sorocaba-Votorantim. Ofertas repetidas foram juntadas
// (ex.: Administração semipresencial + EAD; Design de Interiores em dois campi). Marketing bacharelado e tecnólogo
// viraram 'Marketing'; 'Tecnologia em Produção Audiovisual' virou 'Produção Audiovisual'. 'Artes Visuais' e
// 'Licenciatura em Artes' são cursos separados no site e ficaram separados. Cursos:
// https://www.belasartes.br/graduacao/matriz-cursos-de-graduacao/ (consultado em 19/11/2026). Campi:
// https://www.belasartes.br/ (seção de campi e rodapé); cursos por campus:
// https://www.belasartes.br/wp-json/wp/v2/graduacao.
export const BELAS_ARTES: Community = {
  id: 'belas-artes',
  name: 'Centro Universitário Belas Artes de São Paulo',
  shortName: 'Belas Artes',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'BELAS',
  mainCampus: 'Campus Vila Mariana',
  campuses: [
    { name: 'Campus Vila Mariana', address: 'Rua Dr. Álvaro Alvim, 90 – Vila Mariana' },
    { name: 'Campus Paraíso', address: 'Rua Estela, 64 – Vila Mariana' },
    { name: 'Campus Shopping Cidade Jardim', address: 'Av. Magalhães de Castro, 12.000, 2º andar – Cidade Jardim' },
  ],
  // TODO: confirmar com a instituição. BAIXA. Não achei nenhuma fonte oficial dizendo qual é o e-mail do aluno.
  // belasartes.edu.br tem registro MX no Microsoft 365 (belasartes-edu-br.mail.protection.outlook.com), o que indica
  // um e-mail institucional separado do da equipe, mas é dedução, não confirmação. belasartes.br é o domínio dos
  // funcionários e setores (ex.: cursos@belasartes.br) e não foi incluído. Os guias de boas-vindas 2024/2025 só
  // pedem que o aluno mantenha atualizado o e-mail cadastrado. Confirmar com a instituição antes de ativar.
  emailDomains: ['belasartes.edu.br'],
  courses: [
    'Administração', 'Análise e Desenvolvimento de Sistemas', 'Arquitetura e Urbanismo', 'Artes Cênicas',
    'Artes Plásticas', 'Artes Visuais', 'Cinema e Audiovisual', 'Comunicação Digital', 'Comércio Exterior',
    'Conservação e Restauro', 'Dança', 'Design Digital', 'Design Gráfico', 'Design de Animação', 'Design de Games',
    'Design de Interiores', 'Design de Moda', 'Design de Produto', 'Economia Criativa', 'Escrita Criativa',
    'Fotografia', 'Gastronomia', 'Gestão de Negócios e Inovação', 'História', 'Jogos Digitais', 'Jornalismo',
    'Licenciatura em Artes', 'Marketing', 'Negócios da Moda', 'Produção Audiovisual', 'Produção Cultural',
    'Produção Fonográfica', 'Produção Multimídia', 'Produção Publicitária', 'Psicologia',
    'Publicidade e Propaganda', 'Relações Internacionais', 'Relações Públicas', 'Rádio, TV e Internet',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['BELAS2026', 'FUNDADORES'],
};

// Os 9 cursos de graduação, todos presenciais, no único campus (Liberdade). A FECAP não tem graduação EAD: EAD,
// semipresencial, FLEX e LIVE aparecem só na pós e no MBA, que ficaram de fora. A instituição de ensino se chama
// Centro Universitário Álvares Penteado (é o que está na fachada) e é mantida pela Fundação. O nome da fundação foi
// usado como 'name', como pedido. Cursos: https://www.fecap.br/graduacao/ (consultado em 19/11/2026). Campi:
// https://www.fecap.br/graduacao/ (rodapé: 'Liberdade – Av. da Liberdade, 532 - Liberdade, São Paulo').
export const FECAP: Community = {
  id: 'fecap',
  name: 'Fundação Escola de Comércio Álvares Penteado',
  shortName: 'FECAP',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'FECAP',
  mainCampus: 'Campus Liberdade',
  campuses: [
    { name: 'Campus Liberdade', address: 'Av. da Liberdade, 532 – Liberdade' },
  ],
  // TODO: confirmar com a instituição. BAIXA-MÉDIA. Não achei fonte oficial (o Manual do Aluno 2026, no Google
  // Sites, não fala de e-mail). edu.fecap.br tem MX próprio no Microsoft 365
  // (edu-fecap-br.mail.protection.outlook.com), separado do fecap.br dos funcionários. É o padrão típico de e-mail
  // de aluno (como edu.pucrs.br), mas é dedução. fecap.br (funcionários) não foi incluído. Confirmar com a FECAP.
  emailDomains: ['edu.fecap.br'],
  courses: [
    'Administração', 'Análise e Desenvolvimento de Sistemas', 'Ciência da Computação', 'Ciências Contábeis',
    'Ciências Econômicas', 'Publicidade e Propaganda', 'Relações Internacionais', 'Relações Públicas',
    'Secretariado e Assessoria Executiva',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['FECAP2026', 'FUNDADORES'],
  cover: {
    source: require('../../assets/campus/fecap.jpg'),
    sourceWide: require('../../assets/campus/fecap-largo.jpg'),
    author: 'Dornicke',
    license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:FECAP_01.jpg',
    place: 'Fachada da Av. da Liberdade, Campus Liberdade',
  },
};

// Só as unidades da cidade de São Paulo do edital presencial de 2027: Campus Santo Amaro, Unidade Lapa Scipião
// (Design de Animação e Fotografia, tecnólogos) e Unidade Tiradentes (Enfermagem, Farmácia, Psicologia, Radiologia).
// Águas de São Pedro e Campos do Jordão ficam de fora. Quando o mesmo nome existe como bacharelado e como tecnólogo,
// entra uma vez só: Jogos Digitais e Fotografia têm as duas versões. 'Bacharelado em Design Moda' aparece como
// 'Design de Moda'. A página /graduacao monta a lista de cursos por JavaScript; o edital é a fonte oficial e
// completa. A página cita uma Licenciatura em Educação Física que não está no edital presencial, então deve ser EAD
// e ficou de fora. Não achei edital semipresencial de graduação para São Paulo. Cursos:
// https://www.sp.senac.br/documents/20125/43199727/edital_graduacao.pdf (Edital nº 049/2026, graduação presencial,
// 1º semestre de 2027, Anexo II: cursos e vagas por campus), linkado em https://www.sp.senac.br/graduacao
// (consultado em 19/11/2026). Campi: Edital nº 049/2026 (nomes das unidades e endereço de Santo Amaro);
// https://www.sp.senac.br/senac-lapa-scipiao e https://www.sp.senac.br/senac-tiradentes (endereços). Só entram as
// unidades do Senac em SP que têm graduação; as outras unidades da capital oferecem cursos livres e técnicos..
export const SENAC: Community = {
  id: 'senac',
  name: 'Centro Universitário Senac',
  shortName: 'Senac',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'SENAC',
  mainCampus: 'Campus Santo Amaro',
  campuses: [
    { name: 'Campus Santo Amaro', address: 'Av. Engenheiro Eusébio Stevaux, 823 – Santo Amaro' },
    { name: 'Unidade Lapa Scipião', address: 'Rua Scipião, 67 – Lapa' },
    { name: 'Unidade Tiradentes', address: 'Av. Tiradentes, 822 – Centro' },
  ],
  // TODO: confirmar com a instituição. baixa a média: senacsp.edu.br existe e tem MX no Microsoft 365 (tenant
  // educacional, típico de contas de alunos), mas não achei fonte oficial pública que diga que é o e-mail dos alunos
  // de graduação. O domínio corporativo sp.senac.br (usado pela secretaria, ex.:
  // universitariosantoamaro@sp.senac.br) é de funcionários e ficou de fora de propósito. Confirmar com o Senac.
  emailDomains: ['senacsp.edu.br'],
  courses: [
    'Administração', 'Análise e Desenvolvimento de Sistemas', 'Arquitetura e Urbanismo', 'Audiovisual',
    'Ciência da Computação', 'Ciências Contábeis', 'Design', 'Design Gráfico', 'Design de Animação',
    'Design de Moda', 'Educação Física', 'Enfermagem', 'Engenharia da Computação', 'Engenharia de Produção',
    'Engenharia de Software', 'Estética e Cosmética', 'Farmácia', 'Fotografia', 'Gastronomia', 'Gestão Comercial',
    'Gestão Financeira', 'Gestão da Tecnologia da Informação', 'Gestão de Hospitalidade',
    'Gestão de Recursos Humanos', 'Hotelaria', 'Inteligência Artificial', 'Jogos Digitais', 'Logística',
    'Marketing', 'Nutrição', 'Processos Gerenciais', 'Produção Multimídia', 'Psicologia',
    'Publicidade e Propaganda', 'Radiologia', 'Redes de Computadores', 'Sistemas de Informação',
    'Sistemas para Internet',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['SENAC2026', 'FUNDADORES'],
};

// LISTA PARCIAL, NÃO VERIFICADA POR COMPLETO. Os sites cruzeirodosul.edu.br e cursos.cruzeirodosul.edu.br (e o
// servidor de PDFs arquivos.cruzeirodosuleducacional.edu.br) devolvem HTTP 403 a qualquer acesso automatizado,
// inclusive aos editais em PDF, então não deu para ler o quadro oficial de cursos. Cada curso aqui foi confirmado
// como presencial em São Paulo só por trechos de busca do edital 2º sem/2026 e das páginas de curso da própria
// universidade (ex.: Relações Públicas presencial na Liberdade, à noite; Gastronomia presencial no Anália Franco;
// Publicidade em São Miguel/Anália Franco/Liberdade). Enfermagem, Engenharia Civil, Engenharia Mecânica e Pedagogia
// vêm de uma listagem de terceiros e são os menos seguros; Odontologia e Psicologia aparecem como graduação na home.
// Quase certamente faltam cursos (ex.: Ciências Contábeis, Educação Física, Farmácia, Nutrição, Estética,
// Engenharias). Antes de publicar, alguém deve abrir o edital no navegador e completar a lista. O EAD (Cruzeiro do
// Sul Virtual) ficou de fora. Cursos:
// https://www.cruzeirodosul.edu.br/wp-content/uploads/2026/05/Edital-CRUZEIRO-DO-SUL-2sem2026.pdf (edital da
// graduação presencial, 2º sem/2026) e páginas de curso em https://cursos.cruzeirodosul.edu.br/graduacao, ambos
// lidos só por trechos de busca (ver nota) (consultado em 19/11/2026). Campi:
// https://www.cruzeirodosul.edu.br/a-cruzeiro-do-sul/nossas-unidades/ e o edital da graduação presencial do 2º
// sem/2026, ambos só por trechos de busca (o site bloqueia acesso automatizado). O número de São Miguel aparece como
// '111 a 213' e '211 a 213' em fontes diferentes. Guarulhos também aparece no edital, mas fica fora da capital. A
// UNICID (Tatuapé/Pinheiros) é do mesmo grupo, mas é outra instituição..
export const CRUZEIRO_DO_SUL: Community = {
  id: 'cruzeiro-do-sul',
  name: 'Universidade Cruzeiro do Sul',
  shortName: 'Cruzeiro do Sul',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'CSUL',
  mainCampus: 'Campus Anália Franco',
  campuses: [
    { name: 'Campus Anália Franco', address: 'Av. Regente Feijó, 1295 – Tatuapé' },
    { name: 'Campus Liberdade', address: 'Rua Galvão Bueno, 868 – Liberdade' },
    { name: 'Campus Paulista', address: 'Av. Paulista, 1415 – Bela Vista' },
    { name: 'Campus Santo Amaro', address: 'Av. das Nações Unidas, 18605 – Vila Almeida' },
    { name: 'Campus São Miguel', address: 'Av. Dr. Ussiel Cirilo, 211 – Vila Jacuí' },
    { name: 'Campus Villa-Lobos', address: 'Av. Imperatriz Leopoldina, 550 – Vila Leopoldina' },
  ],
  // TODO: confirmar com a instituição. baixa: os dois domínios existem e têm MX no Microsoft 365. Nenhuma fonte
  // pública diz qual é o 'e-mail acadêmico' dos alunos: o portal só fala em 'entrar com e-mail acadêmico' e tem a
  // opção 'Não sei meu e-mail acadêmico'. O palpite é que cs.cruzeirodosul.edu.br seja o de alunos e
  // cruzeirodosul.edu.br o institucional/funcionários. Confirmar com a instituição antes de liberar o cadastro.
  emailDomains: ['cs.cruzeirodosul.edu.br'],
  courses: [
    'Administração', 'Análise e Desenvolvimento de Sistemas', 'Arquitetura e Urbanismo', 'Biomedicina',
    'Ciência da Computação', 'Direito', 'Enfermagem', 'Engenharia Civil', 'Engenharia Mecânica',
    'Engenharia de Software', 'Fisioterapia', 'Gastronomia', 'Gestão da Tecnologia da Informação', 'Jornalismo',
    'Marketing', 'Medicina Veterinária', 'Odontologia', 'Pedagogia', 'Psicologia', 'Publicidade e Propaganda',
    'Relações Internacionais', 'Relações Públicas', 'Terapia Ocupacional',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['CSUL2026', 'FUNDADORES'],
  cover: {
    source: require('../../assets/campus/cruzeiro-do-sul.jpg'),
    sourceWide: require('../../assets/campus/cruzeiro-do-sul-largo.jpg'),
    author: 'UniCzS',
    license: 'CC BY-SA 3.0',
    url: 'https://commons.wikimedia.org/wiki/File:Unicsul-Analia-Franco-2.jpg',
    place: 'Prédio tombado, Campus Anália Franco',
  },
};

// O site não dá uma lista confiável por campus: no filtro por campus, os campi com código duplo devolvem o catálogo
// inteiro. Então entra o curso que aparece no filtro da cidade de São Paulo e que tem professores da modalidade
// presencial em algum campus da capital no quadro de docentes da página do curso (out/2026).
// Bacharelado/licenciatura e as habilitações foram juntados (Ciências Biológicas, Educação Física, Letras,
// Engenharia Elétrica eletrônica/eletrotécnica). Todos os semipresenciais oferecidos nos polos da capital
// (Biomedicina, Ciências Biológicas, Educação Física, Eng. Civil, Eng. de Produção, Estética, Farmácia,
// Fisioterapia, Nutrição, Pedagogia) já estão na lista. EAD puro fica de fora. Ficaram de fora, por dúvida, cursos
// que o filtro da capital marca como presenciais mas que não têm professores listados em campus de SP (provavelmente
// novos ou sem turma): Comunicação Institucional, Design de Produto, Mídias Sociais Digitais, Sistemas Embarcados,
// Manutenção Industrial, Gestão da Produção Industrial, Gestão da Qualidade e Turismo. Engenharia Aeronáutica tem
// professores em Indianópolis, mas não aparece no filtro da capital, e ficou de fora. Cursos:
// https://www.unip.br/cursos/graduacao/ (filtro Estado SP > Cidade São Paulo) e as páginas de cada curso em
// https://www.unip.br/cursos/graduacao/tradicionais/*.aspx e /tecnologicos/*.aspx (quadro 'Docentes – Modalidade
// Presencial' por campus, referência outubro/2026) (consultado em 19/11/2026). Campi:
// https://www.unip.br/universidade/localidades/unidades-proprias (página em JavaScript, vista no navegador em
// 19/11/2026). São os 10 campi próprios da cidade de São Paulo; Alphaville fica em Santana de Parnaíba e ficou de
// fora. Os ~25 polos EAD da capital também ficaram de fora..
export const UNIP: Community = {
  id: 'unip',
  name: 'Universidade Paulista',
  shortName: 'UNIP',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'UNIP',
  mainCampus: 'Campus Indianópolis',
  campuses: [
    { name: 'Campus Indianópolis', address: 'Rua Dr. Bacelar, 1212 – Vila Clementino' },
    { name: 'Campus Anchieta', address: 'Rua General Leite de Castro, 201 – Jardim Santa Cruz' },
    { name: 'Campus Chácara Santo Antônio', address: 'Rua Cancioneiro Popular, 210 – Chácara Santo Antônio' },
    { name: 'Campus Cidade Universitária', address: 'Av. Torres de Oliveira, 330 – Jaguaré' },
    { name: 'Campus Marquês', address: 'Av. Marquês de São Vicente, 3001 – Água Branca' },
    { name: 'Campus Norte', address: 'Rua Amazonas da Silva, 737 – Vila Guilherme' },
    { name: 'Campus Paraíso/Vergueiro', address: 'Rua Vergueiro, 1211 – Paraíso' },
    { name: 'Campus Paulista', address: 'Av. Paulista, 900 – Bela Vista' },
    { name: 'Campus Pinheiros', address: 'Rua Padre Carvalho, 566 – Pinheiros' },
    { name: 'Campus Tatuapé', address: 'Rua Antônio Macedo, 505 – Tatuapé' },
  ],
  // TODO: confirmar com a instituição. média-alta: aluno.unip.br existe como domínio próprio com MX no Microsoft
  // 365, e o nome deixa claro que é de alunos. Não achei página oficial que documente isso. unip.br (funcionários,
  // MX Proofpoint) e unipinterativa.edu.br (EAD) ficaram de fora. Confirmar com a UNIP.
  emailDomains: ['aluno.unip.br'],
  courses: [
    'Administração', 'Análise e Desenvolvimento de Sistemas', 'Arquitetura e Urbanismo', 'Artes Visuais',
    'Automação Industrial', 'Biomedicina', 'Ciência da Computação', 'Ciências Biológicas', 'Ciências Contábeis',
    'Ciências Econômicas', 'Comércio Exterior', 'Design Gráfico', 'Design de Interiores', 'Design de Moda',
    'Direito', 'Educação Física', 'Enfermagem', 'Engenharia Agrícola', 'Engenharia Ambiental', 'Engenharia Civil',
    'Engenharia Elétrica', 'Engenharia Mecânica', 'Engenharia da Computação',
    'Engenharia de Controle e Automação (Mecatrônica)', 'Engenharia de Produção', 'Estética e Cosmética',
    'Farmácia', 'Fisioterapia', 'Fotografia', 'Gastronomia', 'Gestão Comercial', 'Gestão Financeira',
    'Gestão da Tecnologia da Informação', 'Gestão de Recursos Humanos',
    'Gestão de Startups e Empreendedorismo Digital', 'Jornalismo', 'Letras', 'Logística', 'Marketing', 'Matemática',
    'Medicina Veterinária', 'Nutrição', 'Odontologia', 'Pedagogia', 'Processos Gerenciais', 'Produção Audiovisual',
    'Propaganda e Marketing', 'Psicologia', 'Publicidade e Propaganda', 'Radiologia', 'Redes de Computadores',
    'Relações Internacionais', 'Sistemas de Informação',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['UNIP2026', 'FUNDADORES'],
};

// Apenas os cursos presenciais de São Paulo (unidades Aclimação e Paulista), conforme o Manual do Candidato do
// vestibular 2027. A Paulista não tem curso exclusivo: tudo o que ela oferece também existe na Aclimação. Ficam de
// fora o curso só online (Sistemas para Internet) e o semipresencial, que é oferecido só no Rio de Janeiro e em
// Porto Alegre. Agentes Inteligentes e Gestão de IA aparecem como 'Online' na página /graduacao, mas o manual de
// 2027 lista turmas presenciais deles na Aclimação (e Gestão de IA também na Paulista). Cursos:
// https://www.fiap.com.br/graduacao/documents/informacoes-academicas/manuais/manual_do_candidato_2027_ps1.pdf
// (Manual do Candidato 2027, quadro de cursos presenciais das unidades Aclimação e Paulista) e
// https://www.fiap.com.br/graduacao/ (consultado em 19/11/2026). Campi: https://www.fiap.com.br/graduacao/ e o
// Manual do Candidato 2027 (a unidade Aclimação ocupa os nº 1264 e 1222 da Av. Lins de Vasconcelos; o site as chama
// de 'FIAP Aclimação Campus 1' e 'Campus 2').
export const FIAP: Community = {
  id: 'fiap',
  name: 'Faculdade de Informática e Administração Paulista',
  shortName: 'FIAP',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'FIAP',
  mainCampus: 'Unidade Aclimação',
  campuses: [
    { name: 'Unidade Aclimação', address: 'Av. Lins de Vasconcelos, 1264 – Aclimação' },
    { name: 'Unidade Paulista', address: 'Av. Paulista, 1106 – Bela Vista' },
  ],
  // TODO: confirmar com a instituição. média: fiap.com.br é o domínio institucional (MX no Microsoft 365, usado
  // pelos canais de atendimento). Não achei fonte pública confirmando o formato do e-mail de aluno (relatos de
  // alunos indicam rmNNNNN@fiap.com.br, não verificado). Confirmar com a FIAP.
  emailDomains: ['fiap.com.br'],
  courses: [
    'Administração', 'Agentes Inteligentes', 'Análise e Desenvolvimento de Sistemas', 'Banco de Dados',
    'Ciência da Computação', 'Design Gráfico', 'Engenharia Mecatrônica', 'Engenharia de Computação',
    'Engenharia de Software', 'Gestão da Tecnologia da Informação', 'Gestão de Inteligência Artificial',
    'Inteligência Artificial', 'Jogos Digitais', 'Marketing', 'Segurança Cibernética', 'Sistemas de Informação',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['FIAP2026', 'FUNDADORES'],
  cover: {
    source: require('../../assets/campus/fiap.jpg'),
    sourceWide: require('../../assets/campus/fiap-largo.jpg'),
    author: 'Germanoparra',
    license: 'CC BY 3.0',
    url: 'https://commons.wikimedia.org/wiki/File:Fiap-paulista-coworking.jpg',
    place: 'Coworking, Unidade Paulista',
  },
};

export const SAO_PAULO: Community[] = [USP, FGV, INSPER, ESPM, FAAP, UNIFESP, CASPER, ANHEMBI, SAO_JUDAS, UNINOVE, BELAS_ARTES, FECAP, SENAC, CRUZEIRO_DO_SUL, UNIP, FIAP];
