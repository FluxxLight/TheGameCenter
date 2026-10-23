-- =============================================================================
-- The Game Center — Stage 4: Discovery Metadata & Profile Activity Index
-- Project: the-game-center (ngtxlrpeetsmljbylbvz)
-- =============================================================================

ALTER TABLE public.catalog_games
  ADD COLUMN IF NOT EXISTS popularity_score integer NOT NULL DEFAULT 85,
  ADD COLUMN IF NOT EXISTS critic_score numeric(3,1) NOT NULL DEFAULT 8.8,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS catalog_games_popularity_idx
  ON public.catalog_games (popularity_score DESC, title ASC);

CREATE INDEX IF NOT EXISTS user_game_events_user_occurred_idx
  ON public.user_game_events (user_id, occurred_at DESC);

-- Enrich featured & popular scores on catalog titles
UPDATE public.catalog_games
SET
  popularity_score = CASE title
    WHEN 'Elden Ring' THEN 99
    WHEN 'Baldur''s Gate 3' THEN 98
    WHEN 'The Witcher 3: Wild Hunt' THEN 97
    WHEN 'Red Dead Redemption 2' THEN 97
    WHEN 'Clair Obscur: Expedition 33' THEN 96
    WHEN 'Cyberpunk 2077' THEN 95
    WHEN 'Hollow Knight' THEN 95
    WHEN 'God of War Ragnarök' THEN 94
    WHEN 'The Legend of Zelda: Tears of the Kingdom' THEN 96
    WHEN 'Hades' THEN 94
    WHEN 'Persona 5 Royal' THEN 93
    WHEN 'Grand Theft Auto V' THEN 96
    WHEN 'Sekiro: Shadows Die Twice' THEN 93
    WHEN 'Bloodborne' THEN 94
    WHEN 'Chrono Trigger' THEN 93
    WHEN 'Resident Evil 4' THEN 93
    WHEN 'Minecraft' THEN 95
    WHEN 'Stardew Valley' THEN 92
    ELSE 88
  END,
  critic_score = CASE title
    WHEN 'Elden Ring' THEN 9.6
    WHEN 'Baldur''s Gate 3' THEN 9.7
    WHEN 'The Witcher 3: Wild Hunt' THEN 9.5
    WHEN 'Red Dead Redemption 2' THEN 9.7
    WHEN 'Clair Obscur: Expedition 33' THEN 9.4
    WHEN 'The Legend of Zelda: Tears of the Kingdom' THEN 9.6
    WHEN 'Hollow Knight' THEN 9.4
    WHEN 'Hades' THEN 9.3
    WHEN 'Persona 5 Royal' THEN 9.5
    WHEN 'Chrono Trigger' THEN 9.6
    WHEN 'Bloodborne' THEN 9.4
    WHEN 'Sekiro: Shadows Die Twice' THEN 9.3
    ELSE 8.9
  END,
  is_featured = title IN (
    'Elden Ring',
    'Baldur''s Gate 3',
    'Clair Obscur: Expedition 33',
    'Cyberpunk 2077',
    'Hollow Knight',
    'Red Dead Redemption 2',
    'The Legend of Zelda: Tears of the Kingdom',
    'Hades'
  );

-- Additional curated discovery classics & indies
INSERT INTO public.catalog_games (
  title, cover_url, genre, platforms, default_platform,
  developer, publisher, release_date, description,
  popularity_score, critic_score, is_featured, tags
)
SELECT * FROM (VALUES
  (
    'Portal 2',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/620/library_600x900_2x.jpg',
    'Puzzle',
    ARRAY['PC', 'PlayStation 3', 'Xbox 360', 'Nintendo Switch'],
    'PC',
    'Valve',
    'Valve',
    DATE '2011-04-18',
    'Enigmas baseados em física espacial, narrativa afiada e modo cooperativo lendário nos laboratórios da Aperture Science.',
    92, 9.5, false, ARRAY['Puzzle', 'Co-op', 'Ficção Científica']
  ),
  (
    'Street Fighter 6',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1364780/library_600x900_2x.jpg',
    'Luta',
    ARRAY['PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S'],
    'PlayStation 5',
    'Capcom',
    'Capcom',
    DATE '2023-06-02',
    'Nova geração dos jogos de luta com sistema Drive, World Tour e netcode competitivo de altíssima precisão.',
    90, 9.2, false, ARRAY['Competitivo', 'Arcade', 'Multiplayer']
  ),
  (
    'Sid Meier''s Civilization VI',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/289070/library_600x900_2x.jpg',
    'Estratégia',
    ARRAY['PC', 'PlayStation 4', 'Xbox One', 'Nintendo Switch', 'Mobile'],
    'PC',
    'Firaxis Games',
    '2K',
    DATE '2016-10-21',
    'Construa um império desde a Idade da Pedra até a Era Espacial através de diplomacia, ciência, cultura ou conquista.',
    91, 9.0, false, ARRAY['4X', 'Turnos', 'Histórico']
  ),
  (
    'Subnautica',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/264710/library_600x900_2x.jpg',
    'Sobrevivência',
    ARRAY['PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'Nintendo Switch'],
    'PC',
    'Unknown Worlds Entertainment',
    'Unknown Worlds Entertainment',
    DATE '2018-01-23',
    'Explore as profundezas misteriosas de um oceano alienígena, construa submarinos e descubra os segredos do planeta 4546B.',
    90, 9.1, false, ARRAY['Exploração', 'Sci-Fi', 'Crafting']
  ),
  (
    'Balatro',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/2379780/library_600x900_2x.jpg',
    'Estratégia',
    ARRAY['PC', 'PlayStation 5', 'Xbox Series X/S', 'Nintendo Switch', 'Mobile'],
    'PC',
    'LocalThunk',
    'Playstack',
    DATE '2024-02-20',
    'Roguelike hipnótico de construção de baralhos inspirado no pôquer, repleto de sinergias explosivas e curingas únicos.',
    94, 9.3, true, ARRAY['Roguelike', 'Deckbuilder', 'Indie']
  ),
  (
    'NieR:Automata',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/524220/library_600x900_2x.jpg',
    'RPG de Ação',
    ARRAY['PC', 'PlayStation 4', 'Xbox One', 'Nintendo Switch'],
    'PC',
    'PlatinumGames',
    'Square Enix',
    DATE '2017-02-23',
    'Combate fluido e uma jornada filosófica inesquecível com 2B, 9S e A2 em uma Terra pós-apocalíptica.',
    93, 9.3, false, ARRAY['Hack and Slash', 'Trilha Sonora', 'Sci-Fi']
  )
) AS v(
  title, cover_url, genre, platforms, default_platform,
  developer, publisher, release_date, description,
  popularity_score, critic_score, is_featured, tags
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.catalog_games cg WHERE lower(cg.title) = lower(v.title)
);
