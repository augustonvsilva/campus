import type { IconName } from '@/components/ui';
import type { EventCategory, GroupKind, PlaceCategory } from './types';

export const GROUP_KINDS: { id: GroupKind; label: string; icon: IconName }[] = [
  { id: 'atletica', label: 'Atlética', icon: 'trophy' },
  { id: 'bateria', label: 'Bateria', icon: 'musical-notes' },
  { id: 'coletivo', label: 'Coletivo', icon: 'megaphone' },
  { id: 'curso', label: 'Curso / CA', icon: 'school' },
  { id: 'interesse', label: 'Interesse', icon: 'sparkles' },
];
export const groupKind = (id: GroupKind) => GROUP_KINDS.find((k) => k.id === id)!;

export const GROUP_COLORS = ['#C8F25A', '#7FD8FF', '#FF8FB1', '#FFB86B', '#B69CFF', '#6EE7B7', '#FDE047', '#FF6B6B'];

export const EVENT_CATEGORIES: { id: EventCategory; label: string; icon: IconName }[] = [
  { id: 'festa', label: 'Festas', icon: 'musical-notes' },
  { id: 'jogo', label: 'Jogos', icon: 'football' },
  { id: 'treino', label: 'Treinos e ensaios', icon: 'barbell' },
  { id: 'cultura', label: 'Cultura', icon: 'color-palette' },
  { id: 'academico', label: 'Acadêmico', icon: 'school' },
  { id: 'encontro', label: 'Encontros', icon: 'people' },
];

export const PLACE_CATEGORIES: { id: PlaceCategory; label: string; icon: IconName }[] = [
  { id: 'bar', label: 'Bares', icon: 'beer' },
  { id: 'restaurante', label: 'Comer', icon: 'restaurant' },
  { id: 'cafe', label: 'Cafés', icon: 'cafe' },
  { id: 'estudo', label: 'Estudar', icon: 'book' },
];

export const eventCategory = (id: EventCategory) => EVENT_CATEGORIES.find((c) => c.id === id)!;
export const placeCategory = (id: PlaceCategory) => PLACE_CATEGORIES.find((c) => c.id === id)!;
export const price = (n: 1 | 2 | 3) => '$'.repeat(n);

export const REPORT_REASONS = [
  'Assédio ou bullying',
  'Discurso de ódio ou discriminação',
  'Ameaça ou violência',
  'Conteúdo sexual',
  'Exposição de dados pessoais',
  'Spam ou golpe',
  'Informação falsa',
  'Outro motivo',
];
