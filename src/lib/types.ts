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
  /** Cursos de graduação oferecidos na lista do cadastro (há também "Outro curso"). */
  courses: string[];
  /** Códigos de convite válidos (no backend real, vêm da tabela `invites`). */
  inviteCodes: string[];
  /** Prefixo dos convites gerados pelos membros. Ex.: "MACK" → MACK-7KQ2P. */
  invitePrefix: string;
  /** Campus principal, usado nos textos de exemplo. Ex.: "Campus Higienópolis". */
  mainCampus: string;
  /**
   * ativa: aparece no app. dormindo: já configurada, mas desligada até o lançamento
   * (dá para testar no site de demonstração com ?comunidade=<id>).
   */
  status: 'ativa' | 'dormindo';
  /** Foto do campus usada como fundo. Sem ela, o fundo mostra só o logo do Campus. */
  cover?: CampusPhoto;
}

/** Foto de fundo de uma universidade: precisa ter licença que permita o uso, com crédito. */
export interface CampusPhoto {
  /** Arquivo local (require) ou endereço da imagem. */
  source: number | { uri: string };
  /** Autor, quando a licença exige crédito. Ex.: "Charlesblack". */
  author?: string;
  /** Ex.: "CC BY-SA 1.0" ou "CC0" (domínio público). */
  license?: string;
  /** Página da foto (onde estão autor e licença), quando houver. */
  url?: string;
  /** Ex.: "Campus Higienópolis". */
  place: string;
  /** Recorte mais largo para a capa do computador (faixa bem baixa). Sem ele, usa `source`. */
  sourceWide?: number | { uri: string };
}

/**
 * email = verificado por código enviado ao e-mail institucional; manual = aprovado pela moderação
 * (comprovante); pending = ainda não verificado; rejected = vínculo não comprovado.
 */
export type Verification = 'email' | 'manual' | 'pending' | 'rejected';
export type Role = 'member' | 'moderator' | 'admin';

export interface User {
  id: ID;
  communityId: ID;
  name: string;
  handle: string;
  /** E-mail de login (pode ser pessoal). */
  email?: string;
  /** E-mail institucional confirmado. Só é carregado para o próprio usuário. */
  institutionalEmail?: string;
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
  /** Chave Pix para pagar a comunidade organizadora (o Campus não intermedeia). */
  pixKey?: string;
  reservations: ID[];
  /** Conversa da saída. */
  comments: Comment[];
  createdBy?: ID;
  createdAt: number;
  cancelled?: boolean;
}

export interface Comment {
  id: ID;
  authorId: ID;
  text: string;
  createdAt: number;
  editedAt?: number;
}

/** Mensagem privada (por enquanto só no modo demonstração). */
export interface Message {
  id: ID;
  fromId: ID;
  toId: ID;
  text: string;
  createdAt: number;
  readAt?: number;
}

/** Onde fica um comentário: publicação, Bora? ou conversa de saída. */
export type CommentTarget = 'post' | 'bora' | 'ride';

export type ActivityKind = 'follow' | 'like' | 'comment' | 'reply' | 'bora_join' | 'ride_reserve' | 'group_join';

/** Algo que outra pessoa fez com o seu conteúdo (central de atividade). */
export interface Activity {
  id: string;
  kind: ActivityKind;
  actorId: ID;
  targetType: 'usuario' | 'post' | 'bora' | 'saida' | 'comunidade';
  targetId: ID;
  snippet?: string;
  at: number;
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
  editedAt?: number;
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
  /** Venda de ingressos pelo próprio Campus (por enquanto só no modo demonstração). */
  ticketing?: Ticketing;
  sponsored?: boolean;
  interested: ID[];
  going: ID[];
}

/** Lote/tipo de ingresso (1º lote, meia, open bar…). Preço em centavos. */
export interface TicketLot {
  id: ID;
  name: string;
  priceCents: number;
  quantity: number;
  /** Já vendidos fora deste aparelho (base da demonstração). */
  sold: number;
}

export interface Ticketing {
  lots: TicketLot[];
  /** Chave Pix de quem recebe (organização). */
  pixKey: string;
  /** Nome que aparece no Pix (recebedor). */
  receiver: string;
}

export type PaymentMethod = 'pix' | 'cartao';

/** Ingresso emitido: um por pessoa, com QR code próprio. */
export interface Ticket {
  id: ID;
  orderId: ID;
  eventId: ID;
  lotId: ID;
  buyerId: ID;
  holderName: string;
  email: string;
  priceCents: number;
  method: PaymentMethod;
  /** Cartão: só bandeira e 4 últimos dígitos (o número nunca é guardado). */
  cardLabel?: string;
  /** Código lido na portaria (também vai no QR). */
  code: string;
  createdAt: number;
  checkedInAt?: number;
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
