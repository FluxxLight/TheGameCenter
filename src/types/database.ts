export type GameStatus = 'Jogando' | 'Zerei' | 'Quero Jogar' | 'Abandonei';

export const GAME_STATUSES: readonly GameStatus[] = [
  'Jogando',
  'Zerei',
  'Quero Jogar',
  'Abandonei',
] as const;

export const COMMON_GENRES: readonly string[] = [
  'RPG de Ação',
  'RPG',
  'RPG Tático',
  'RPG por Turnos',
  'JRPG',
  'Ação e Aventura',
  'Ação e Mundo Aberto',
  'FPS Competitivo',
  'FPS Tático',
  'Shooter Cooperativo',
  'Metroidvania',
  'Roguelike',
  'Survival Horror',
  'Plataforma',
  'Simulação / RPG',
  'Sandbox / Sobrevivência',
  'Corrida',
  'Estratégia',
  'Luta',
  'Esportes',
  'Puzzle / Indie',
] as const;

export const COMMON_PLATFORMS: readonly string[] = [
  'PC',
  'PlayStation 5',
  'PlayStation 4',
  'Xbox Series X/S',
  'Xbox One',
  'Nintendo Switch',
  'Steam Deck',
  'Mobile',
  'SNES / Retrô',
  'Multiplataforma',
] as const;

export interface Profile {
  id: string;
  email: string | null;
  username: string;
  display_name: string;
  player_code: string;
  avatar_url: string | null;
  bio: string;
  favorite_platform: string;
  favorite_genre: string;
  theme_preference: string;
  created_at: string;
  updated_at: string;
}

export interface CatalogGame {
  id: string;
  title: string;
  cover_url: string | null;
  genre: string;
  platforms: string[];
  default_platform: string;
  developer: string;
  publisher: string;
  release_date: string | null;
  description: string;
  additional_info: Record<string, unknown>;
  created_at: string;
}

export interface UserGame {
  id: string;
  user_id: string;
  catalog_game_id: string | null;
  is_manual: boolean;
  title: string;
  cover_url: string | null;
  genre: string;
  platform: string;
  status: GameStatus;
  rating: number | null;
  hours_played: number;
  started_at: string | null;
  completed_at: string | null;
  description: string;
  developer: string;
  publisher: string;
  release_date: string | null;
  personal_notes: string;
  additional_info: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type GameEventType =
  | 'added'
  | 'started_playing'
  | 'status_changed'
  | 'completed'
  | 'rating_updated'
  | 'hours_updated'
  | 'note_added';

export interface UserGameEvent {
  id: string;
  user_game_id: string;
  user_id: string;
  event_type: GameEventType;
  from_status: string | null;
  to_status: string | null;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
}

export interface UserGameInput {
  catalog_game_id?: string | null;
  is_manual?: boolean;
  title: string;
  cover_url?: string | null;
  genre: string;
  platform: string;
  status: GameStatus;
  rating?: number | null;
  hours_played?: number;
  started_at?: string | null;
  completed_at?: string | null;
  description?: string;
  developer?: string;
  publisher?: string;
  release_date?: string | null;
  personal_notes?: string;
  additional_info?: Record<string, unknown>;
}

export interface LibraryStats {
  totalGames: number;
  playingCount: number;
  completedCount: number;
  backlogCount: number;
  droppedCount: number;
  totalHours: number;
  averageRating: number | null;
  completionRate: number;
}
