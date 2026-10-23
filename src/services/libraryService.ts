import { supabase } from '@/lib/supabase/client';
import { validateGameInput } from '@/lib/validation/gameValidation';
import {
  CatalogGame,
  GameStatus,
  LibraryStats,
  UserGame,
  UserGameEvent,
  UserGameInput,
} from '@/types/database';

function normalizeUserGameRow(row: Record<string, unknown>): UserGame {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    catalog_game_id: (row.catalog_game_id as string | null) ?? null,
    is_manual: Boolean(row.is_manual),
    title: String(row.title ?? ''),
    cover_url: (row.cover_url as string | null) ?? null,
    genre: String(row.genre ?? 'Ação'),
    platform: String(row.platform ?? 'PC'),
    status: (row.status as GameStatus) ?? 'Quero Jogar',
    rating:
      row.rating !== null && row.rating !== undefined ? Number(row.rating) : null,
    hours_played:
      row.hours_played !== null && row.hours_played !== undefined
        ? Number(row.hours_played)
        : 0,
    started_at: (row.started_at as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
    description: String(row.description ?? ''),
    developer: String(row.developer ?? ''),
    publisher: String(row.publisher ?? ''),
    release_date: (row.release_date as string | null) ?? null,
    personal_notes: String(row.personal_notes ?? ''),
    additional_info:
      typeof row.additional_info === 'object' && row.additional_info !== null
        ? (row.additional_info as Record<string, unknown>)
        : {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function searchCatalogGames(query: string): Promise<CatalogGame[]> {
  const trimmed = query.trim();
  let builder = supabase.from('catalog_games').select('*');

  if (trimmed.length > 0) {
    const escaped = trimmed.replace(/[%_\\]/g, '\\$&');
    builder = builder.ilike('title', `%${escaped}%`);
  }

  const { data, error } = await builder.order('title', { ascending: true }).limit(24);

  if (error) {
    throw new Error('Erro ao pesquisar catálogo de jogos.');
  }

  return (data ?? []) as CatalogGame[];
}

export async function listAllCatalogGames(): Promise<CatalogGame[]> {
  const { data, error } = await supabase
    .from('catalog_games')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    throw new Error('Erro ao carregar catálogo de jogos.');
  }

  return (data ?? []) as CatalogGame[];
}

export async function listUserGames(userId: string): Promise<UserGame[]> {
  const { data, error } = await supabase
    .from('user_games')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error('Não foi possível carregar sua biblioteca de jogos.');
  }

  return (data ?? []).map((row) => normalizeUserGameRow(row as Record<string, unknown>));
}

export async function getUserGameById(
  gameId: string,
  userId: string
): Promise<UserGame | null> {
  const { data, error } = await supabase
    .from('user_games')
    .select('*')
    .eq('id', gameId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error('Erro ao buscar detalhes do jogo.');
  }

  if (!data) return null;
  return normalizeUserGameRow(data as Record<string, unknown>);
}

export async function listGameEvents(
  gameId: string,
  userId: string
): Promise<UserGameEvent[]> {
  const { data, error } = await supabase
    .from('user_game_events')
    .select('*')
    .eq('user_game_id', gameId)
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false });

  if (error) {
    throw new Error('Erro ao carregar histórico pessoal do jogo.');
  }

  return (data ?? []) as UserGameEvent[];
}

export async function addUserGame(
  userId: string,
  input: UserGameInput,
  existingLibrary: Pick<UserGame, 'id' | 'title'>[] = []
): Promise<UserGame> {
  const validation = validateGameInput(input, existingLibrary);
  if (!validation.valid) {
    const firstMsg = Object.values(validation.errors)[0];
    throw new Error(firstMsg || 'Dados inválidos para cadastro do jogo.');
  }

  const payload = {
    user_id: userId,
    catalog_game_id: input.catalog_game_id ?? null,
    is_manual: input.is_manual ?? !input.catalog_game_id,
    title: input.title.trim(),
    cover_url: input.cover_url?.trim() || null,
    genre: input.genre.trim(),
    platform: input.platform.trim(),
    status: input.status,
    rating:
      input.rating !== null && input.rating !== undefined && !Number.isNaN(Number(input.rating))
        ? Number(Number(input.rating).toFixed(1))
        : null,
    hours_played: Number(Number(input.hours_played ?? 0).toFixed(1)),
    started_at: input.started_at || null,
    completed_at: input.completed_at || null,
    description: input.description ?? '',
    developer: input.developer?.trim() ?? '',
    publisher: input.publisher?.trim() ?? '',
    release_date: input.release_date || null,
    personal_notes: input.personal_notes ?? '',
    additional_info: input.additional_info ?? {},
  };

  const { data, error } = await supabase
    .from('user_games')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Este jogo já está cadastrado na sua biblioteca.');
    }
    throw new Error(error.message || 'Erro ao adicionar jogo à biblioteca.');
  }

  return normalizeUserGameRow(data as Record<string, unknown>);
}

export async function updateUserGame(
  gameId: string,
  userId: string,
  input: UserGameInput,
  existingLibrary: Pick<UserGame, 'id' | 'title'>[] = []
): Promise<UserGame> {
  const validation = validateGameInput(input, existingLibrary, gameId);
  if (!validation.valid) {
    const firstMsg = Object.values(validation.errors)[0];
    throw new Error(firstMsg || 'Dados inválidos na atualização do jogo.');
  }

  const payload = {
    title: input.title.trim(),
    cover_url: input.cover_url?.trim() || null,
    genre: input.genre.trim(),
    platform: input.platform.trim(),
    status: input.status,
    rating:
      input.rating !== null && input.rating !== undefined && !Number.isNaN(Number(input.rating))
        ? Number(Number(input.rating).toFixed(1))
        : null,
    hours_played: Number(Number(input.hours_played ?? 0).toFixed(1)),
    completed_at: input.completed_at || null,
    description: input.description ?? '',
    developer: input.developer?.trim() ?? '',
    publisher: input.publisher?.trim() ?? '',
    release_date: input.release_date || null,
    personal_notes: input.personal_notes ?? '',
    additional_info: input.additional_info ?? {},
  };

  const { data, error } = await supabase
    .from('user_games')
    .update(payload)
    .eq('id', gameId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe outro jogo com este mesmo título na sua biblioteca.');
    }
    throw new Error(error.message || 'Erro ao salvar alterações do jogo.');
  }

  return normalizeUserGameRow(data as Record<string, unknown>);
}

export async function quickUpdateGameStatus(
  gameId: string,
  userId: string,
  newStatus: GameStatus
): Promise<UserGame> {
  const updateFields: Record<string, unknown> = { status: newStatus };
  if (newStatus === 'Zerei') {
    // Trigger in PostgreSQL sets completed_at = CURRENT_DATE if still null
  }

  const { data, error } = await supabase
    .from('user_games')
    .update(updateFields)
    .eq('id', gameId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Erro ao alterar status do jogo.');
  }

  return normalizeUserGameRow(data as Record<string, unknown>);
}

export async function deleteUserGame(gameId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_games')
    .delete()
    .eq('id', gameId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message || 'Erro ao remover jogo da biblioteca.');
  }
}

export function computeLibraryStats(games: UserGame[]): LibraryStats {
  const totalGames = games.length;
  const playingCount = games.filter((g) => g.status === 'Jogando').length;
  const completedCount = games.filter((g) => g.status === 'Zerei').length;
  const backlogCount = games.filter((g) => g.status === 'Quero Jogar').length;
  const droppedCount = games.filter((g) => g.status === 'Abandonei').length;

  const totalHours = Number(
    games.reduce((acc, g) => acc + (Number(g.hours_played) || 0), 0).toFixed(1)
  );

  const ratedGames = games.filter(
    (g) => g.rating !== null && g.rating !== undefined && !Number.isNaN(Number(g.rating))
  );
  const averageRating =
    ratedGames.length > 0
      ? Number(
          (
            ratedGames.reduce((acc, g) => acc + Number(g.rating), 0) / ratedGames.length
          ).toFixed(1)
        )
      : null;

  const completionRate =
    totalGames > 0 ? Math.round((completedCount / totalGames) * 100) : 0;

  return {
    totalGames,
    playingCount,
    completedCount,
    backlogCount,
    droppedCount,
    totalHours,
    averageRating,
    completionRate,
  };
}
