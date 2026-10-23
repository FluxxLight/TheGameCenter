-- =========================================================================
-- THE GAME CENTER — DATABASE FOUNDATION & PERSONAL LIBRARY MIGRATION
-- Target Project: the-game-center (ngtxlrpeetsmljbylbvz)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Unique Player Code Generator (TGC-XXXX-XXXX)
CREATE OR REPLACE FUNCTION public.generate_unique_player_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alphabet CONSTANT TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  candidate TEXT;
  part1 TEXT;
  part2 TEXT;
  i INT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    part1 := '';
    part2 := '';
    FOR i IN 1..4 LOOP
      part1 := part1 || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      part2 := part2 || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    candidate := 'TGC-' || part1 || '-' || part2;

    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE player_code = candidate
    ) INTO exists_already;

    IF NOT exists_already THEN
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$;

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT NOT NULL CHECK (
    char_length(btrim(username)) >= 3
    AND char_length(btrim(username)) <= 30
    AND username ~ '^[a-zA-Z0-9_.-]+$'
  ),
  display_name TEXT NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 80),
  player_code TEXT NOT NULL UNIQUE DEFAULT public.generate_unique_player_code(),
  avatar_url TEXT CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 250000),
  bio TEXT NOT NULL DEFAULT '' CHECK (char_length(bio) <= 500),
  favorite_platform TEXT NOT NULL DEFAULT 'PC' CHECK (char_length(favorite_platform) <= 60),
  favorite_genre TEXT NOT NULL DEFAULT 'RPG' CHECK (char_length(favorite_genre) <= 60),
  theme_preference TEXT NOT NULL DEFAULT 'obsidian-cyber' CHECK (char_length(theme_preference) <= 50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uidx
  ON public.profiles (lower(btrim(username)));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Catalog Games (Base Searchable Game Catalog)
CREATE TABLE IF NOT EXISTS public.catalog_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  cover_url TEXT,
  genre TEXT NOT NULL,
  platforms TEXT[] NOT NULL DEFAULT ARRAY['PC'],
  default_platform TEXT NOT NULL DEFAULT 'PC',
  developer TEXT NOT NULL DEFAULT '',
  publisher TEXT NOT NULL DEFAULT '',
  release_date DATE,
  description TEXT NOT NULL DEFAULT '',
  additional_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_games_read_all"
  ON public.catalog_games FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. User Games (Personal Library — Technical Validation Only, Zero Semantic Censorship)
CREATE TABLE IF NOT EXISTS public.user_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  catalog_game_id UUID REFERENCES public.catalog_games(id) ON DELETE SET NULL,
  is_manual BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL CHECK (
    char_length(btrim(title)) >= 1
    AND char_length(btrim(title)) <= 200
  ),
  cover_url TEXT CHECK (cover_url IS NULL OR char_length(cover_url) <= 250000),
  genre TEXT NOT NULL DEFAULT 'Ação' CHECK (
    char_length(btrim(genre)) >= 1
    AND char_length(btrim(genre)) <= 100
  ),
  platform TEXT NOT NULL DEFAULT 'PC' CHECK (
    char_length(btrim(platform)) >= 1
    AND char_length(btrim(platform)) <= 100
  ),
  status TEXT NOT NULL DEFAULT 'Quero Jogar' CHECK (
    status IN ('Jogando', 'Zerei', 'Quero Jogar', 'Abandonei')
  ),
  rating NUMERIC(4,1) CHECK (
    rating IS NULL OR (rating >= 0 AND rating <= 10)
  ),
  hours_played NUMERIC(8,1) NOT NULL DEFAULT 0 CHECK (
    hours_played >= 0 AND hours_played <= 99999
  ),
  started_at DATE,
  completed_at DATE,
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 5000),
  developer TEXT NOT NULL DEFAULT '' CHECK (char_length(developer) <= 160),
  publisher TEXT NOT NULL DEFAULT '' CHECK (char_length(publisher) <= 160),
  release_date DATE,
  personal_notes TEXT NOT NULL DEFAULT '' CHECK (char_length(personal_notes) <= 4000),
  additional_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_games_unique_user_title_idx
  ON public.user_games (user_id, lower(btrim(title)));

ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_games FORCE ROW LEVEL SECURITY;

CREATE POLICY "user_games_select_own"
  ON public.user_games FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_games_insert_own"
  ON public.user_games FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_games_update_own"
  ON public.user_games FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_games_delete_own"
  ON public.user_games FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. User Game Events (Personal History Timeline)
CREATE TABLE IF NOT EXISTS public.user_game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_game_id UUID NOT NULL REFERENCES public.user_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'added',
      'started_playing',
      'status_changed',
      'completed',
      'rating_updated',
      'hours_updated',
      'note_added'
    )
  ),
  from_status TEXT,
  to_status TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_events FORCE ROW LEVEL SECURITY;

CREATE POLICY "user_game_events_select_own"
  ON public.user_game_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_game_events_insert_own"
  ON public.user_game_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_game_events_delete_own"
  ON public.user_game_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
