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
  // Foto livre do Wikimedia Commons (Bosque das Fadas, com o letreiro), em dois recortes:
  // celular e computador. A licença exige o crédito, que aparece no app.
  cover: {
    source: require('../../assets/campus/mackenzie.jpg'),
    sourceWide: require('../../assets/campus/mackenzie-largo.jpg'),
    author: 'Luiz de Visconte',
    license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:Mackcapus2.jpg',
    place: 'Bosque das Fadas, Campus Higienópolis',
  },
};

// PUC-SP: configurada e DORMINDO (não aparece para ninguém). Para acordar no lançamento:
// status 'ativa', EXPO_PUBLIC_COMMUNITY=puc-sp no build e a migration 0009 (is_active + convite).
// Cursos conforme pucsp.br/graduacao (consultado em 16/11/2026): 33 cursos, sem EAD.
export const PUC_SP: Community = {
  id: 'puc-sp',
  name: 'Pontifícia Universidade Católica de São Paulo',
  shortName: 'PUC-SP',
  city: 'São Paulo',
  status: 'dormindo',
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

/** Chave (no navegador) da comunidade escolhida para teste no site de demonstração. */
const TEST_KEY = 'campus:comunidade-teste';

/**
 * Comunidade deste app. Normal: a do build (EXPO_PUBLIC_COMMUNITY, padrão Mackenzie).
 * Teste: no site de demonstração (sem Supabase), ?comunidade=puc-sp liga uma comunidade —
 * inclusive dormindo — só neste navegador; ?comunidade=mackenzie volta ao normal.
 */
function resolveActive(): { community: Community; testing: boolean } {
  const byId = (id?: string | null) => COMMUNITIES.find((c) => c.id === id);
  const built = byId(process.env.EXPO_PUBLIC_COMMUNITY) ?? MACKENZIE;
  const demo = !process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!demo || typeof window === 'undefined' || !window.location) return { community: built, testing: false };
  try {
    const asked = new URLSearchParams(window.location.search).get('comunidade');
    if (asked !== null) {
      if (byId(asked) && asked !== built.id) window.localStorage.setItem(TEST_KEY, asked);
      else window.localStorage.removeItem(TEST_KEY);
    }
    const test = byId(window.localStorage.getItem(TEST_KEY));
    return test && test.id !== built.id ? { community: test, testing: true } : { community: built, testing: false };
  } catch {
    return { community: built, testing: false };
  }
}

const resolved = resolveActive();
export const ACTIVE_COMMUNITY = resolved.community;
/** true quando o site de demonstração está mostrando outra comunidade só para teste. */
export const COMMUNITY_TEST_MODE = resolved.testing;

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? '';
}

export function isInstitutionalEmail(email: string, community: Community = ACTIVE_COMMUNITY) {
  return community.emailDomains.includes(emailDomain(email));
}
