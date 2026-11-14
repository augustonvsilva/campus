import type { Community } from './types';

// Lançamento: apenas Mackenzie. Novas universidades entram como novos registros
// aqui (e na tabela `communities` do backend), sem mudar o resto do app.
export const MACKENZIE: Community = {
  id: 'mackenzie',
  name: 'Universidade Presbiteriana Mackenzie',
  shortName: 'Mackenzie',
  city: 'São Paulo',
  // TODO: confirmar com a instituição os domínios usados por alunos.
  emailDomains: ['mackenzista.com.br', 'mackenzie.br'],
  // Graduação presencial da Universidade (Higienópolis, Alphaville e Campinas), conforme mackenzie.br/graduacao
  // (consultado em 14/11/2026). Variantes de turma (ex.: Ciências Contábeis "Para Graduados" e "Dual Study")
  // entram no curso principal. EAD e as Faculdades (Rio, Brasília, Curitiba) ficam de fora: usam "Outro curso".
  courses: [
    'Administração', 'Administração (Gestão de Comércio Exterior)', 'Arquitetura e Urbanismo', 'Ciência da Computação',
    'Ciências Biológicas', 'Ciências Contábeis', 'Ciências Econômicas', 'Cinema e Audiovisual', 'Design', 'Direito',
    'Engenharia Civil', 'Engenharia da Computação', 'Engenharia de Materiais', 'Engenharia de Produção', 'Engenharia Elétrica',
    'Engenharia Mecânica', 'Engenharia Química', 'Farmácia', 'Fisioterapia', 'Gastronomia (Tecnólogo)', 'Jornalismo', 'Letras',
    'Medicina', 'Nutrição', 'Pedagogia', 'Psicologia', 'Publicidade e Propaganda', 'Química', 'Sistemas de Informação', 'Teologia',
  ],
  // Códigos de demonstração. No backend, convites são individuais e têm limite de uso.
  inviteCodes: ['MACK2026', 'FUNDADORES'],
};

export const ACTIVE_COMMUNITY = MACKENZIE;

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? '';
}

export function isInstitutionalEmail(email: string, community: Community = ACTIVE_COMMUNITY) {
  return community.emailDomains.includes(emailDomain(email));
}
