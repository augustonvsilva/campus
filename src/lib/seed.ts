// Dados de demonstração — pessoas, lugares e eventos FICTÍCIOS.
// Os horários são relativos ao momento em que o app é aberto, para o "Agora" ter conteúdo.
import { ACTIVE_COMMUNITY } from './community';
import { at, DAY, HOUR, MIN } from './time';
import type { Bora, CampusEvent, Group, Place, Post, Report, Ride, User, VerificationRequest } from './types';

const C = ACTIVE_COMMUNITY.id;

export function seedData(now = Date.now()) {
  const user = (id: string, name: string, course: string, semester: string, color: string, interests: string[]): User => ({
    id,
    communityId: C,
    name,
    handle: name.split(' ')[0]!.toLowerCase() + '.' + id.slice(2, 4),
    course,
    semester,
    interests,
    color,
    verification: 'email',
    role: 'member',
    joinedAt: now - 20 * DAY,
  });

  const users: Record<string, User> = {};
  [
    user('u_ana', 'Ana Ribeiro', 'Arquitetura e Urbanismo', '5º', '#FFB86B', ['design', 'café', 'exposições']),
    user('u_bruno', 'Bruno Teixeira', 'Engenharia Civil', '3º', '#7FD8FF', ['futsal', 'atlética']),
    user('u_carla', 'Carla Mendes', 'Publicidade e Propaganda', '6º', '#FF8FB1', ['festas', 'fotografia']),
    user('u_diego', 'Diego Sato', 'Ciência da Computação', '4º', '#C8F25A', ['games', 'estudos']),
    user('u_eduarda', 'Eduarda Lima', 'Direito', '2º', '#B69CFF', ['debates', 'música']),
    user('u_felipe', 'Felipe Costa', 'Administração', '7º', '#6EE7B7', ['corrida', 'empreendedorismo']),
    user('u_gabi', 'Gabriela Nunes', 'Design', '5º', '#FDE047', ['ilustração', 'cultura']),
    user('u_promo', 'Promo Ingressos', 'Administração', '1º', '#FF8FB1', []),
  ].forEach((u) => (users[u.id] = u));
  // Perfil reservado: detalhes só para conexões mútuas.
  users.u_eduarda = { ...users.u_eduarda!, profileVisible: false };
  // Aluno sem e-mail institucional aguardando verificação (aparece no painel de moderação).
  users.u_henrique = { ...user('u_henrique', 'Henrique Alves', 'Ciências Econômicas', '1º', '#7FD8FF', ['xadrez']), verification: 'pending' };

  // Jogo de hoje: 19h, ou daqui a 1h se já passou das 18h.
  const gameStart = Math.max(at(0, 19, 0, now), now + HOUR);

  const posts: Post[] = [
    {
      id: 'p1', communityId: C, authorId: 'u_bruno', createdAt: now - 50 * MIN,
      expiresAt: gameStart + 2 * HOUR,
      text: 'Quem vai no futsal hoje? Engenharia x Direito no ginásio. Bora encher a arquibancada!',
      likes: ['u_ana', 'u_diego', 'u_felipe'],
      comments: [
        { id: 'c1', authorId: 'u_eduarda', text: 'Direito vai em peso 😤', createdAt: now - 40 * MIN },
        { id: 'c2', authorId: 'u_diego', text: 'Tô dentro, saio da aula e vou direto', createdAt: now - 30 * MIN },
      ],
    },
    {
      id: 'p2', communityId: C, authorId: 'u_diego', createdAt: now - 25 * MIN,
      text: 'Alguém sabe se a biblioteca abre no sábado? Preciso estudar pra P2 de Cálculo.',
      likes: ['u_felipe'],
      comments: [{ id: 'c3', authorId: 'u_ana', text: 'Acho que abre de manhã, mas confirma no site antes', createdAt: now - 15 * MIN }],
    },
    {
      id: 'p3', communityId: C, authorId: 'u_carla', createdAt: now - 2 * HOUR,
      text: 'Pesquisa rápida: onde vocês almoçam perto do campus gastando até R$ 30?',
      poll: [
        { id: 'o1', label: 'PF perto da faculdade', votes: ['u_bruno', 'u_felipe', 'u_eduarda'] },
        { id: 'o2', label: 'Lanchonete', votes: ['u_diego'] },
        { id: 'o3', label: 'Restaurante universitário', votes: ['u_ana', 'u_gabi'] },
        { id: 'o4', label: 'Marmita de casa', votes: [] },
      ],
      likes: ['u_ana'],
      comments: [],
    },
    {
      id: 'p4', communityId: C, authorId: 'u_gabi', createdAt: now - 3 * HOUR,
      text: 'A exposição de fim de semestre de Design abre essa semana. Vem ver os projetos da turma! 🎨',
      likes: ['u_ana', 'u_carla', 'u_eduarda', 'u_bruno'],
      comments: [{ id: 'c4', authorId: 'u_ana', text: 'Vou levar o pessoal de Arquitetura', createdAt: now - 2 * HOUR }],
    },
    {
      id: 'p5', communityId: C, authorId: 'u_ana', createdAt: now - 5 * HOUR, expiresAt: now + 3 * HOUR,
      text: 'Dica: o café da praça tá sem fila agora, e tem tomada livre nas mesas do fundo ☕',
      likes: ['u_gabi', 'u_diego'],
      comments: [],
    },
    {
      id: 'p6', communityId: C, authorId: 'u_felipe', createdAt: now - 8 * HOUR,
      text: 'Montando grupo de estudos de Contabilidade pra terça à tarde. Quem topa? Vou abrir um Bora? 👇',
      likes: [],
      comments: [],
    },
    {
      id: 'p8', communityId: C, authorId: 'u_promo', createdAt: now - 4 * HOUR,
      text: 'VENDO INGRESSO PRA TODAS AS FESTAS COM 70% DE DESCONTO!!! Pix antecipado, chama no privado 🔥🔥',
      likes: [],
      comments: [],
    },
    {
      id: 'p7', communityId: C, authorId: 'u_eduarda', createdAt: now - 26 * HOUR,
      text: 'Perdi um guarda-chuva preto perto da biblioteca. Se alguém achar, me chama!',
      likes: ['u_carla'],
      comments: [],
    },
  ];

  const ev = (e: Omit<CampusEvent, 'communityId'>): CampusEvent => ({ ...e, communityId: C });
  const events: CampusEvent[] = [
    ev({
      id: 'e1', title: 'Feira de Estágios', category: 'academico',
      startsAt: now - HOUR, endsAt: now + 3 * HOUR,
      location: 'Campus Higienópolis — área de convivência',
      organizer: 'Centro Acadêmico (exemplo)',
      description: 'Empresas recebendo currículos e conversando com estudantes de todos os cursos. Leve seu currículo impresso ou o QR code do LinkedIn.',
      interested: ['u_felipe', 'u_diego', 'u_eduarda'], going: ['u_felipe'],
    }),
    ev({
      id: 'e2', title: 'Futsal: Engenharia x Direito', category: 'jogo', groupId: 'g_eng',
      startsAt: gameStart, endsAt: gameStart + 2 * HOUR,
      location: 'Ginásio', organizer: 'Atlética de Engenharia (exemplo)',
      description: 'Rodada do campeonato interno. Entrada gratuita, venha com a camisa do seu curso.',
      interested: ['u_ana', 'u_carla'], going: ['u_bruno', 'u_diego', 'u_eduarda'],
    }),
    ev({
      id: 'e3', title: 'Calourada de Fim de Ano', category: 'festa',
      startsAt: at(1, 22, 0, now), endsAt: at(2, 4, 0, now),
      location: 'Casa de eventos (endereço de exemplo)', organizer: 'Atléticas reunidas (exemplo)',
      description: 'Festa de encerramento do semestre com DJs da comunidade. Proibida a entrada de menores de 18 anos.',
      ticketUrl: 'https://example.com/ingressos', sponsored: true,
      ticketing: {
        pixKey: 'atleticas.reunidas@exemplo.com', receiver: 'Atleticas Reunidas',
        lots: [
          { id: 'e3-l1', name: '1º lote', priceCents: 4000, quantity: 200, sold: 200 },
          { id: 'e3-l2', name: '2º lote', priceCents: 5500, quantity: 300, sold: 212 },
          { id: 'e3-l3', name: 'Open bar', priceCents: 12000, quantity: 80, sold: 77 },
        ],
      },
      interested: ['u_ana', 'u_gabi', 'u_diego'], going: ['u_carla', 'u_bruno'],
    }),
    ev({
      id: 'e4', title: 'Sarau no Gramado', category: 'cultura',
      startsAt: at(2, 17, 0, now), endsAt: at(2, 20, 0, now),
      location: 'Gramado central', organizer: 'Coletivo de Letras (exemplo)',
      description: 'Microfone aberto para poesia, música e leitura. Traga sua canga!',
      interested: ['u_eduarda', 'u_gabi'], going: [],
    }),
    ev({
      id: 'e5', title: 'Workshop: Portfólio que Contrata', category: 'academico',
      startsAt: at(3, 10, 0, now), endsAt: at(3, 12, 0, now),
      location: 'Auditório (exemplo)', organizer: 'Núcleo de Carreiras (exemplo)',
      description: 'Como montar um portfólio enxuto para estágio em design, arquitetura e comunicação.',
      interested: ['u_ana', 'u_gabi', 'u_carla'], going: ['u_gabi'],
    }),
    ev({
      id: 'e6', title: 'Interatlética de Vôlei', category: 'jogo', groupId: 'g_eng',
      startsAt: at(5, 15, 0, now), endsAt: at(5, 19, 0, now),
      location: 'Ginásio de outra universidade (exemplo)', organizer: 'Atlética de Engenharia (exemplo)',
      description: 'Torneio entre atléticas. Vai ter combi saindo do portão principal — reserve seu lugar na aba Saídas da atlética.',
      interested: ['u_ana'], going: ['u_bruno', 'u_diego', 'u_felipe'],
    }),
    ev({
      id: 'e8', title: 'Ensaio aberto da bateria', category: 'treino', groupId: 'g_bat',
      startsAt: at(1, 19, 0, now), endsAt: at(1, 21, 0, now),
      location: 'Estacionamento coberto (exemplo)', organizer: 'Bateria Universitária (exemplo)',
      description: 'Ensaio aberto para quem quer conhecer a bateria. Não precisa saber tocar — a gente empresta instrumento.',
      interested: ['u_eduarda'], going: ['u_carla', 'u_gabi'],
    }),
    ev({
      id: 'e9', title: 'Treino de futsal (seletiva)', category: 'treino', groupId: 'g_eng',
      startsAt: at(2, 18, 0, now), endsAt: at(2, 20, 0, now),
      location: 'Quadra 2', organizer: 'Atlética de Engenharia (exemplo)',
      description: 'Seletiva para o time do semestre que vem. Traga tênis de quadra.',
      interested: ['u_felipe'], going: ['u_bruno', 'u_diego'],
    }),
    ev({
      id: 'e7', title: 'Noite do Karaokê', category: 'encontro',
      startsAt: at(6, 20, 0, now), endsAt: at(6, 23, 30, now),
      location: 'Bar parceiro (exemplo)', organizer: 'Campus',
      description: 'Encontro aberto para conhecer gente de outros cursos. Sem ingresso.',
      interested: ['u_carla', 'u_eduarda', 'u_felipe'], going: ['u_carla'],
    }),
  ];

  const bora = (b: Omit<Bora, 'communityId' | 'comments' | 'visibility'> & Partial<Bora>): Bora => ({
    communityId: C, comments: [], visibility: 'comunidade', ...b,
  });
  const boras: Bora[] = [
    bora({
      id: 'b1', authorId: 'u_diego', activity: 'Estudar Cálculo II em grupo',
      startsAt: now + 40 * MIN, meetingPoint: 'Biblioteca — térreo, mesas do fundo',
      capacity: 6, participants: ['u_diego', 'u_felipe', 'u_eduarda'], createdAt: now - 20 * MIN,
      comments: [{ id: 'bc1', authorId: 'u_felipe', text: 'Levo as listas resolvidas', createdAt: now - 10 * MIN }],
    }),
    bora({
      id: 'b2', authorId: 'u_bruno', activity: 'Ver o futsal juntos e torcer pela Engenharia',
      startsAt: gameStart - 15 * MIN, meetingPoint: 'Entrada do ginásio',
      participants: ['u_bruno', 'u_diego'], createdAt: now - 45 * MIN,
    }),
    bora({
      id: 'b3', authorId: 'u_carla', activity: 'Almoço depois da aula',
      startsAt: now + 80 * MIN, meetingPoint: 'Portão principal',
      capacity: 5, participants: ['u_carla', 'u_ana'], createdAt: now - 30 * MIN,
    }),
    bora({
      id: 'b4', authorId: 'u_felipe', activity: 'Corrida leve de 5 km',
      startsAt: at(1, 7, 0, now), meetingPoint: 'Portão principal',
      capacity: 8, participants: ['u_felipe'], createdAt: now - 3 * HOUR,
    }),
    bora({
      id: 'b5', authorId: 'u_gabi', activity: 'Ir ao Sarau no Gramado',
      startsAt: at(2, 17, 0, now), meetingPoint: 'Gramado central',
      participants: ['u_gabi', 'u_eduarda'], createdAt: now - 6 * HOUR,
    }),
  ];

  const place = (p: Omit<Place, 'communityId'>): Place => ({ ...p, communityId: C });
  const places: Place[] = [
    place({
      id: 'l1', name: 'Boteco da Esquina', category: 'bar', priceRange: 2,
      address: 'A 3 min do portão principal (exemplo)', hours: 'seg–sáb, 17h–1h', verified: true,
      recommendations: [
        { id: 'r1', authorId: 'u_bruno', text: 'Melhor lugar pra ver jogo, telão grande.', createdAt: now - 2 * DAY },
        { id: 'r2', authorId: 'u_carla', text: 'Happy hour até as 20h.', createdAt: now - 4 * DAY },
      ],
    }),
    place({
      id: 'l2', name: 'Café Página Dois', category: 'cafe', priceRange: 2,
      address: 'Praça em frente ao campus (exemplo)', hours: 'seg–sex, 7h–20h', verified: true,
      recommendations: [{ id: 'r3', authorId: 'u_ana', text: 'Wi-Fi bom e tomadas nas mesas do fundo.', createdAt: now - DAY }],
    }),
    place({
      id: 'l3', name: 'PF da Dona Lu', category: 'restaurante', priceRange: 1,
      address: 'Rua lateral ao campus (exemplo)', verified: false,
      recommendations: [
        { id: 'r4', authorId: 'u_felipe', text: 'Prato feito caprichado por um preço justo.', createdAt: now - 3 * DAY },
        { id: 'r5', authorId: 'u_eduarda', text: 'Chega antes do meio-dia que lota.', createdAt: now - 5 * DAY },
        { id: 'r6', authorId: 'u_bruno', text: 'Feijoada às quartas!', createdAt: now - 6 * DAY },
      ],
    }),
    place({
      id: 'l4', name: 'Sala de Estudos 24h', category: 'estudo', priceRange: 2,
      address: 'A 8 min a pé (exemplo)', hours: 'todos os dias, 24h', verified: true,
      recommendations: [{ id: 'r7', authorId: 'u_diego', text: 'Silenciosa e com café incluso na diária.', createdAt: now - 2 * DAY }],
    }),
    place({
      id: 'l5', name: 'Bar do Placar', category: 'bar', priceRange: 2,
      address: 'A 5 min do campus (exemplo)', verified: false,
      recommendations: [{ id: 'r8', authorId: 'u_diego', text: 'Rola sinuca e preço bom de porção.', createdAt: now - 7 * DAY }],
    }),
    place({
      id: 'l6', name: 'Lanchonete Ponto Final', category: 'restaurante', priceRange: 1,
      address: 'Ao lado do ponto de ônibus (exemplo)', verified: false, recommendations: [],
    }),
    place({
      id: 'l7', name: 'Cantina do Largo', category: 'restaurante', priceRange: 3,
      address: 'A 10 min a pé (exemplo)', hours: 'ter–dom, 12h–23h', verified: true,
      recommendations: [{ id: 'r9', authorId: 'u_gabi', text: 'Bom pra comemorar fim de semestre.', createdAt: now - 9 * DAY }],
    }),
  ];

  // Comunidades criadas por estudantes (nomes genéricos de exemplo).
  const groups: Group[] = [
    {
      id: 'g_eng', communityId: C, name: 'Atlética de Engenharia', kind: 'atletica', color: '#7FD8FF', verified: true,
      description: 'Jogos, treinos, festas e as combis para os campeonatos. Chega mais, bixo!',
      createdBy: 'u_bruno', createdAt: now - 30 * DAY,
      members: { u_bruno: 'admin', u_diego: 'membro', u_felipe: 'membro', u_eduarda: 'membro' },
    },
    {
      id: 'g_bat', communityId: C, name: 'Bateria Universitária', kind: 'bateria', color: '#FF8FB1', verified: true,
      description: 'Ensaios toda semana e saídas para os jogos e festas. Não precisa saber tocar.',
      createdBy: 'u_carla', createdAt: now - 25 * DAY,
      members: { u_carla: 'admin', u_gabi: 'admin', u_ana: 'membro' },
    },
    {
      id: 'g_xadrez', communityId: C, name: 'Clube de Xadrez', kind: 'interesse', color: '#B69CFF', verified: false,
      description: 'Partidas no intervalo e um torneio por mês. Todos os níveis.',
      createdBy: 'u_diego', createdAt: now - 10 * DAY,
      members: { u_diego: 'admin', u_henrique: 'membro' },
    },
  ];

  const rides: Ride[] = [
    {
      id: 'ride1', communityId: C, groupId: 'g_eng', eventId: 'e6', title: 'Combi para a Interatlética',
      departsAt: at(5, 13, 30, now), departurePoint: 'Portão principal', destination: 'Ginásio da outra universidade',
      seats: 14, price: 'R$ 15 ida e volta', notes: 'Volta logo depois da final. Leve a camisa da atlética!',
      pixKey: 'atletica.eng@exemplo.com',
      reservations: ['u_bruno', 'u_diego', 'u_felipe'], createdBy: 'u_bruno', createdAt: now - 2 * DAY,
      comments: [
        { id: 'rc1', authorId: 'u_diego', text: 'A volta é que horas mais ou menos?', createdAt: now - 20 * HOUR },
        { id: 'rc2', authorId: 'u_bruno', text: 'Uns 40 min depois da final. Aviso aqui quando sair!', createdAt: now - 19 * HOUR },
      ],
    },
    {
      id: 'ride2', communityId: C, groupId: 'g_bat', eventId: 'e3', title: 'Ônibus da bateria para a Calourada',
      departsAt: at(1, 21, 0, now), departurePoint: 'Estacionamento coberto', destination: 'Casa de eventos',
      seats: 40, price: 'R$ 20', notes: 'Prioridade para quem toca. Sobrou lugar? Libera pra geral.',
      reservations: ['u_carla', 'u_gabi', 'u_ana'], createdBy: 'u_carla', createdAt: now - DAY, comments: [],
    },
  ];

  // Quem segue quem (seguidor → seguidos).
  const following: Record<string, string[]> = {
    u_ana: ['u_gabi', 'u_carla', 'u_bruno'],
    u_bruno: ['u_diego', 'u_felipe', 'u_ana', 'u_carla'],
    u_carla: ['u_gabi', 'u_ana', 'u_bruno'],
    u_diego: ['u_bruno', 'u_felipe'],
    u_eduarda: ['u_carla', 'u_gabi'],
    u_felipe: ['u_bruno', 'u_diego'],
    u_gabi: ['u_ana', 'u_carla'],
  };

  // Posts nos murais das comunidades.
  posts.push(
    {
      id: 'p9', communityId: C, authorId: 'u_bruno', groupId: 'g_eng', createdAt: now - 3 * HOUR,
      text: '📣 Combi pra Interatlética aberta! 14 lugares, sai do portão principal. Reserva na aba Saídas.',
      likes: ['u_diego', 'u_felipe'], comments: [],
    },
    {
      id: 'p10', communityId: C, authorId: 'u_gabi', groupId: 'g_bat', createdAt: now - 6 * HOUR,
      text: 'Ensaio aberto amanhã às 19h! Quem quiser conhecer a bateria, cola. A gente empresta instrumento 🥁',
      likes: ['u_carla', 'u_ana', 'u_eduarda'], comments: [],
    },
  );

  const reports: Report[] = [
    {
      id: 'rep1', targetType: 'post', targetId: 'p8', reason: 'Spam ou golpe', details: 'Pede Pix antecipado.',
      reporterId: 'u_carla', createdAt: now - 3 * HOUR, status: 'aberta',
    },
  ];
  const verificationRequests: VerificationRequest[] = [{ id: 'v1', userId: 'u_henrique', createdAt: now - 2 * HOUR }];

  return { users, posts, events, boras, places, reports, verificationRequests, groups, rides, following };
}
