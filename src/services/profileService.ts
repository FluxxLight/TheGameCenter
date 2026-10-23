import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { validateUsernameFormat } from '@/lib/validation/gameValidation';
import { Profile } from '@/types/database';

export async function checkUsernameAvailability(
  username: string,
  ignoreUserId?: string
): Promise<{ available: boolean; reason?: string }> {
  const formatError = validateUsernameFormat(username);
  if (formatError) {
    return { available: false, reason: formatError };
  }

  const { data, error } = await supabase.rpc('is_username_available', {
    candidate: username.trim(),
    ignore_user_id: ignoreUserId ?? null,
  });

  if (error) {
    throw new Error('Não foi possível verificar a disponibilidade do nome de usuário.');
  }

  return {
    available: Boolean(data),
    reason: data ? undefined : 'Este nome de usuário já está em uso.',
  };
}

export async function getOrEnsureProfile(user: User): Promise<Profile> {
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError) {
    throw new Error('Erro ao carregar perfil do jogador.');
  }

  if (existing) {
    return existing as Profile;
  }

  // Fallback recovery if profile wasn't present yet
  const rawUsername =
    (typeof user.user_metadata?.username === 'string' && user.user_metadata.username) ||
    user.email?.split('@')[0] ||
    `player_${user.id.slice(0, 6)}`;

  const cleanUsername = rawUsername
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .slice(0, 22);

  const fallbackUsername =
    cleanUsername.length >= 3 ? cleanUsername : `player_${user.id.slice(0, 6)}`;

  const displayName =
    (typeof user.user_metadata?.display_name === 'string' &&
      user.user_metadata.display_name.trim()) ||
    fallbackUsername;

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email ?? null,
      username: `${fallbackUsername}_${Math.floor(100 + Math.random() * 899)}`,
      display_name: displayName,
    })
    .select('*')
    .single();

  if (insertError || !inserted) {
    // Retry reading once in case trigger finished concurrently
    const { data: retryData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (retryData) return retryData as Profile;
    throw new Error('Não foi possível inicializar o perfil do usuário.');
  }

  return inserted as Profile;
}

export interface ProfileUpdatePayload {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string | null;
  favorite_platform?: string;
  favorite_genre?: string;
  theme_preference?: string;
}

export async function updateUserProfile(
  userId: string,
  payload: ProfileUpdatePayload
): Promise<Profile> {
  if (payload.username !== undefined) {
    const check = await checkUsernameAvailability(payload.username, userId);
    if (!check.available) {
      throw new Error(check.reason || 'Nome de usuário indisponível.');
    }
  }

  const updateBody: Record<string, unknown> = {};
  if (payload.username !== undefined) updateBody.username = payload.username.trim();
  if (payload.display_name !== undefined) updateBody.display_name = payload.display_name.trim();
  if (payload.bio !== undefined) updateBody.bio = payload.bio.slice(0, 500);
  if (payload.avatar_url !== undefined) {
    updateBody.avatar_url = payload.avatar_url?.trim() || null;
  }
  if (payload.favorite_platform !== undefined) {
    updateBody.favorite_platform = payload.favorite_platform.trim();
  }
  if (payload.favorite_genre !== undefined) {
    updateBody.favorite_genre = payload.favorite_genre.trim();
  }
  if (payload.theme_preference !== undefined) {
    updateBody.theme_preference = payload.theme_preference.trim();
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateBody)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Este nome de usuário já está sendo utilizado por outro jogador.');
    }
    throw new Error(error.message || 'Erro ao salvar alterações do perfil.');
  }

  return data as Profile;
}
