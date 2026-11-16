import type { Community } from './types';

// Graduação presencial da Universidade (Higienópolis, Alphaville e Campinas). Variantes de turma
// (ex.: Ciências Contábeis "Para Graduados" e "Dual Study") entram no curso principal.
// As Faculdades (Rio, Brasília, Curitiba) ficam de fora: quem estuda nelas usa "Outro curso".
const PRESENCIAL = [
  'Administração', 'Administração (Gestão de Comércio Exterior)', 'Arquitetura e Urbanismo', 'Ciência da Computação',
  'Ciências Biológicas', 'Ciências Contábeis', 'Ciências Econômicas', 'Cinema e Audiovisual', 'Design', 'Direito',
  'Engenharia Civil', 'Engenharia da Computação', 'Engenharia de Materiais', 'Engenharia de Produção', 'Engenharia Elétrica',
  'Engenharia Mecânica', 'Engenharia Química', 'Farmácia', 'Fisioterapia', 'Gastronomia (Tecnólogo)', 'Jornalismo', 'Letras',
  'Medicina', 'Nutrição', 'Pedagogia', 'Psicologia', 'Publicidade e Propaganda', 'Química', 'Sistemas de Informação', 'Teologia',
];

// Graduação Digital (EAD). O sufixo distingue dos presenciais de mesmo nome (Letras, Pedagogia, Teologia).
const EAD = [
  'Análise e Desenvolvimento de Sistemas', 'Banco de Dados: Análise, Mineração e Engenharia de Dados', 'Ciências da Religião',
  'Filosofia', 'Gestão Comercial', 'Gestão de Recursos Humanos', 'Gestão Financeira', 'História', 'Letras: Português',
  'Marketing', 'Matemática', 'Pedagogia', 'Processos Gerenciais', 'Segurança Cibernética', 'Teologia',
].map((c) => `${c} (EAD)`);

// Lançamento: apenas Mackenzie. Novas universidades entram como novos registros
// aqui (e na tabela `communities` do backend), sem mudar o resto do app.
export const MACKENZIE: Community = {
  id: 'mackenzie',
  name: 'Universidade Presbiteriana Mackenzie',
  shortName: 'Mackenzie',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'MACK',
  mainCampus: 'Campus Higienópolis',
  // TODO: confirmar com a instituição os domínios usados por alunos.
  emailDomains: ['mackenzista.com.br', 'mackenzie.br'],
  // Conforme mackenzie.br/graduacao (consultado em 14/11/2026). Ordem alfabética, presencial e EAD juntos.
  courses: [...PRESENCIAL, ...EAD].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  // Códigos de demonstração. No backend, convites são individuais e têm limite de uso.
  inviteCodes: ['MACK2026', 'FUNDADORES'],
  // Letreiro #MACKENZIE (Campus Higienópolis), enviada pela equipe. Autor e licença a confirmar:
  // antes do lançamento, trocar por foto própria/autorizada ou preencher author/license/url.
  cover: {
    source: require('../../assets/campus/mackenzie.jpg'),
    sourceWide: require('../../assets/campus/mackenzie-largo.jpg'),
    sourceWideLight: require('../../assets/campus/mackenzie-largo-claro.jpg'),
    place: 'Letreiro, Campus Higienópolis',
  },
};

// PUC-SP: ativa (escolhida na tela de entrada). No banco: migrations 0009 e 0010.
// Cursos conforme pucsp.br/graduacao (consultado em 16/11/2026): 33 cursos, sem EAD.
export const PUC_SP: Community = {
  id: 'puc-sp',
  name: 'Pontifícia Universidade Católica de São Paulo',
  shortName: 'PUC-SP',
  city: 'São Paulo',
  status: 'ativa',
  invitePrefix: 'PUC',
  mainCampus: 'Campus Monte Alegre',
  // TODO: confirmar com a instituição os domínios usados por alunos.
  emailDomains: ['pucsp.edu.br'],
  courses: [
    'Administração', 'Arte: História, Crítica e Curadoria', 'Ciência da Computação',
    'Ciência de Dados e Inteligência Artificial', 'Ciências Atuariais', 'Ciências Contábeis',
    'Ciências Econômicas', 'Ciências Sociais', 'Comunicação das Artes do Corpo', 'Comunicação e Multimeios',
    'Design', 'Direito', 'Enfermagem', 'Engenharia Biomédica', 'Engenharia Civil', 'Engenharia de Produção',
    'Engenharia de Sistemas Ciber Físicos', 'Filosofia', 'Fisioterapia', 'Fonoaudiologia', 'História',
    'Jogos Digitais', 'Jornalismo', 'Letras - Análise de Linguagem', 'Letras - Português e Inglês - Licenciatura',
    'Letras: Língua Inglesa - Tradução Inglês/Português', 'Medicina', 'Pedagogia', 'Psicologia',
    'Publicidade e Propaganda', 'Relações Internacionais', 'Serviço Social', 'Teologia',
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  inviteCodes: ['PUC2026', 'FUNDADORES'],
  // Pátio da Cruz (Campus Monte Alegre), Wikimedia Commons, CC0: uso livre, crédito opcional.
  cover: {
    source: require('../../assets/campus/puc-sp.jpg'),
    sourceWide: require('../../assets/campus/puc-sp-largo.jpg'),
    author: 'Pedu0303',
    license: 'CC0',
    url: 'https://commons.wikimedia.org/wiki/File:O_P%C3%A1tio_da_Cruz_%C3%A9_uma_das_pra%C3%A7as_centrais_e_mais_emblem%C3%A1ticas_do_campus_Monte_Alegre_da_PUC-SP,_localizado_no_bairro_de_Perdizes,_zona_oeste_de_S%C3%A3o_Paulo.png',
    place: 'Pátio da Cruz, Campus Monte Alegre',
  },
};

export const COMMUNITIES: Community[] = [MACKENZIE, PUC_SP];

/** Universidades que aparecem para escolher no cadastro e no login (status 'ativa'). */
export const ACTIVE_COMMUNITIES = COMMUNITIES.filter((c) => c.status === 'ativa');

/** Chave (no aparelho) da última universidade escolhida na tela de entrada. */
export const COMMUNITY_PREF_KEY = 'campus:comunidade';

const byId = (id?: string | null) => ACTIVE_COMMUNITIES.find((c) => c.id === id);
let current: Community = byId(process.env.EXPO_PUBLIC_COMMUNITY) ?? ACTIVE_COMMUNITIES[0] ?? MACKENZIE;

/**
 * Universidade em uso agora: a escolhida na tela de entrada e, depois do login, a da conta.
 * Lida na hora (não guarde em constante de módulo), porque muda com o app aberto.
 */
export function activeCommunity(): Community {
  return current;
}

/** Troca a universidade em uso (só entre as ativas). O store chama isto; telas usam useStore().community. */
export function setActiveCommunity(id: string | null | undefined): Community {
  current = byId(id) ?? current;
  return current;
}

/** Link direto para uma universidade no site (ex.: …/campus/?comunidade=puc-sp). */
export function communityFromLink(): string | null {
  try {
    if (typeof window === 'undefined' || !window.location) return null;
    const id = new URLSearchParams(window.location.search).get('comunidade');
    return byId(id) ? id : null;
  } catch {
    return null;
  }
}

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? '';
}

export function isInstitutionalEmail(email: string, community: Community = activeCommunity()) {
  return community.emailDomains.includes(emailDomain(email));
}
