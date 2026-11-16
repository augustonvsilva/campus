import type { CampusPhoto, Community } from './types';

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
  // TODO: confirmar com a instituição os domínios usados por alunos.
  emailDomains: ['mackenzista.com.br', 'mackenzie.br'],
  // Conforme mackenzie.br/graduacao (consultado em 14/11/2026). Ordem alfabética, presencial e EAD juntos.
  courses: [...PRESENCIAL, ...EAD].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  // Códigos de demonstração. No backend, convites são individuais e têm limite de uso.
  inviteCodes: ['MACK2026', 'FUNDADORES'],
  // Capa: cada foto em dois recortes (celular e computador). As do Wikimedia Commons têm licença
  // livre que exige crédito (aparece no app); as demais foram enviadas pela equipe do Campus.
  covers: [
    {
      source: require('../../assets/campus/letreiro.jpg'),
      sourceWide: require('../../assets/campus/letreiro-largo.jpg'),
      place: 'Letreiro, Campus Higienópolis',
    },
    {
      source: require('../../assets/campus/ipes.jpg'),
      sourceWide: require('../../assets/campus/ipes-largo.jpg'),
      place: 'Jacarandás, Campus Higienópolis',
    },
    {
      source: require('../../assets/campus/predio.jpg'),
      sourceWide: require('../../assets/campus/predio-largo.jpg'),
      place: 'Prédio histórico, Campus Higienópolis',
    },
    {
      source: require('../../assets/campus/bosque.jpg'),
      sourceWide: require('../../assets/campus/bosque-largo.jpg'),
      author: 'Luiz de Visconte',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Mackcapus2.jpg',
      place: 'Bosque das Fadas, Campus Higienópolis',
    },
    {
      source: require('../../assets/campus/aerea.jpg'),
      sourceWide: require('../../assets/campus/aerea-largo.jpg'),
      author: 'Charlesblack',
      license: 'CC BY-SA 1.0',
      url: 'https://commons.wikimedia.org/wiki/File:McKenzie_University_(4).jpg',
      place: 'Vista aérea, Campus Higienópolis',
    },
  ],
};

export const ACTIVE_COMMUNITY = MACKENZIE;

// Sorteado uma vez quando o app abre: a capa troca a cada abertura, mas não muda enquanto a pessoa navega.
const COVER_SEED = Math.random();

/** Foto de capa desta abertura do app (a mesma em todas as telas). */
export function coverOf(community: Community): CampusPhoto | undefined {
  const list = community.covers;
  return list?.length ? list[Math.floor(COVER_SEED * list.length)] : undefined;
}

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? '';
}

export function isInstitutionalEmail(email: string, community: Community = ACTIVE_COMMUNITY) {
  return community.emailDomains.includes(emailDomain(email));
}
