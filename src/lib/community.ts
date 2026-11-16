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
  // TODO: confirmar com a instituição os domínios usados por alunos.
  emailDomains: ['mackenzista.com.br', 'mackenzie.br'],
  // Conforme mackenzie.br/graduacao (consultado em 14/11/2026). Ordem alfabética, presencial e EAD juntos.
  courses: [...PRESENCIAL, ...EAD].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  // Códigos de demonstração. No backend, convites são individuais e têm limite de uso.
  inviteCodes: ['MACK2026', 'FUNDADORES'],
  // Foto livre do Wikimedia Commons (vista aérea, sem logo). A licença exige o crédito, que aparece no app.
  cover: {
    source: require('../../assets/campus/mackenzie.jpg'),
    author: 'Charlesblack',
    license: 'CC BY-SA 1.0',
    url: 'https://commons.wikimedia.org/wiki/File:McKenzie_University_(4).jpg',
    place: 'Campus Higienópolis',
  },
};

export const ACTIVE_COMMUNITY = MACKENZIE;

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? '';
}

export function isInstitutionalEmail(email: string, community: Community = ACTIVE_COMMUNITY) {
  return community.emailDomains.includes(emailDomain(email));
}
