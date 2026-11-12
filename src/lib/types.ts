// Modelo de domínio do Campus.
// Todo conteúdo pertence a uma comunidade (communityId): o lançamento é só Mackenzie,
// mas o modelo já nasce multi-universidade.

export type ID = string;

export interface Community {
  id: ID;
  name: string;
  shortName: string;
  city: string;
  /** Domínios de e-mail institucional aceitos para verificação automática. */
  emailDomains: string[];
  /** Códigos de convite válidos (no backend real, vêm da tabela `invites`). */
  inviteCodes: string[];
}

/**
 * email = verificado por e-mail institucional; manual = aprovado pela moderação;
 * pending = verificação alternativa em análise; rejected = vínculo não comprovado.
 */
export type Verification = 'email' | 'manual' | 'pending' | 'rejected';
export type Role = 'member' | 'moderator' | 'admin';

export interface User {
  id: ID;
  communityId: ID;
  name: string;
  handle: string;
  email?: string;
  course?: string;
  semester?: string;
  interests: string[];
  color: string;
  /** Foto de perfil exibível (URL assinada no Supabase, data URI na demo). Sem ela, mostra as iniciais. */
  avatarUrl?: string;
  /** false = perfil reservado (detalhes só para conexões mútuas). */
  profileVisible?: boolean;
  verification: Verification;
  role: Role;
  joinedAt: number;
}

export interface Invite {
  code: string;
  maxUses: number;
  uses: number;
  createdBy?: ID;
  createdAt: number;
}

export interface VerificationRequest {
  id: ID;
  userId: ID;
  /** Caminho no Storage (Supabase) ou URI local (demo). */
  evidence?: string;
  createdAt: number;
}

/** Comunidade criada por estudantes dentro da universidade (atlética, bateria, coletivo…). */
export type GroupKind = 'atletica' | 'bateria' | 'coletivo' | 'curso' | 'interesse';
export type GroupRole = 'admin' | 'membro';

export interface Group {
  id: ID;
  communityId: ID;
  name: string;
  kind: GroupKind;
  description: string;
  color: string;
  /** Selo de comunidade oficial (concedido pela moderação). */
  verified: boolean;
  createdBy?: ID;
  createdAt: number;
  members: Record<ID, GroupRole>;
}

/** Saída organizada por uma comunidade: combi, ônibus, van para jogos e festas. */
export interface Ride {
  id: ID;
  communityId: ID;
  groupId: ID;
  eventId?: ID;
  title: string;
  departsAt: number;
  departurePoint: string;
  destination: string;
  seats?: number;
  price?: string;
  notes?: string;
  reservations: ID[];
  createdBy?: ID;
  createdAt: number;
  cancelled?: boolean;
}

export interface Comment {
  id: ID;
  authorId: ID;
  text: string;
  createdAt: number;
}

export interface PollOption {
  id: ID;
  label: string;
  votes: ID[];
}

export interface Post {
  id: ID;
  communityId: ID;
  authorId: ID;
  /** Publicado no mural de uma comunidade. */
  groupId?: ID;
  text: string;
  createdAt: number;
  /** Validade: depois disso some do feed e do Agora (evita informação desatualizada). */
  expiresAt?: number;
  /** URL exibível (assinada no Supabase, URI local na demo). */
  imageUrl?: string;
  poll?: PollOption[];
  likes: ID[];
  comments: Comment[];
}

export type EventCategory = 'festa' | 'jogo' | 'treino' | 'cultura' | 'academico' | 'encontro';

export interface CampusEvent {
  id: ID;
  communityId: ID;
  title: string;
  category: EventCategory;
  startsAt: number;
  endsAt: number;
  location: string;
  description: string;
  organizer: string;
  /** Evento da agenda de uma comunidade (organizador = a comunidade). */
  groupId?: ID;
  createdBy?: ID;
  ticketUrl?: string;
  sponsored?: boolean;
  interested: ID[];
  going: ID[];
}

/** comunidade = aparece para todos; link = só quem recebe o link. */
export type BoraVisibility = 'comunidade' | 'link';

export interface Bora {
  id: ID;
  communityId: ID;
  authorId: ID;
  activity: string;
  /** Horário aproximado. */
  startsAt: number;
  /** Sempre um ponto de encontro público — nunca localização em tempo real. */
  meetingPoint: string;
  visibility: BoraVisibility;
  capacity?: number;
  participants: ID[];
  comments: Comment[];
  createdAt: number;
  cancelled?: boolean;
}

export type PlaceCategory = 'bar' | 'restaurante' | 'cafe' | 'estudo';

export interface Recommendation {
  id: ID;
  authorId: ID;
  text: string;
  createdAt: number;
}

export interface Place {
  id: ID;
  communityId: ID;
  name: string;
  category: PlaceCategory;
  address: string;
  priceRange: 1 | 2 | 3;
  /** Só exibido quando verificado pela equipe. */
  hours?: string;
  verified: boolean;
  recommendations: Recommendation[];
}

export type ReportTarget = 'post' | 'bora' | 'evento' | 'lugar' | 'usuario' | 'comentario' | 'recomendacao' | 'comunidade' | 'saida';
export type RemovableTarget = 'post' | 'bora' | 'evento' | 'comentario' | 'recomendacao' | 'comunidade' | 'saida';

export interface Report {
  id: ID;
  targetType: ReportTarget;
  targetId: ID;
  reason: string;
  details?: string;
  reporterId: ID;
  createdAt: number;
  status: 'aberta' | 'resolvida' | 'descartada';
}

export interface Settings {
  notify: { boras: boolean; eventos: boolean; comentarios: boolean };
  profileVisible: boolean;
  showBoraParticipation: boolean;
}
