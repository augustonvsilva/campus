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
  // TODO: conferir com a grade oficial de graduação (campus Higienópolis). Quem não achar o curso usa "Outro curso".
  courses: [
    'Administração', 'Arquitetura e Urbanismo', 'Ciência da Computação', 'Ciências Biológicas', 'Ciências Contábeis',
    'Ciências Econômicas', 'Design', 'Direito', 'Educação Física', 'Engenharia Civil', 'Engenharia de Computação',
    'Engenharia de Materiais', 'Engenharia de Produção', 'Engenharia Elétrica', 'Engenharia Mecânica', 'Engenharia Química',
    'Farmácia', 'Filosofia', 'Física', 'Fonoaudiologia', 'Jornalismo', 'Letras', 'Matemática', 'Medicina', 'Nutrição',
    'Pedagogia', 'Psicologia', 'Publicidade e Propaganda', 'Química', 'Relações Internacionais', 'Sistemas de Informação',
    'Teologia',
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
