import { GAME_STATUSES, GameStatus, UserGame, UserGameInput } from '@/types/database';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === value;
}

/**
 * Validação estritamente técnica para títulos e metadados de jogos.
 * REGRA DO PROJETO: Nenhuma moderação semântica, filtro de palavras ou censura
 * é aplicada ao nome do jogo — títulos de obras são preservados integralmente.
 */
export function validateGameInput(
  input: UserGameInput,
  existingLibrary: Pick<UserGame, 'id' | 'title'>[] = [],
  editingGameId?: string
): ValidationResult {
  const errors: Record<string, string> = {};

  const trimmedTitle = (input.title ?? '').trim();
  if (!trimmedTitle) {
    errors.title = 'Informe o nome do jogo.';
  } else if (trimmedTitle.length > 200) {
    errors.title = 'O nome do jogo deve ter no máximo 200 caracteres.';
  } else {
    const normalizedCandidate = trimmedTitle.toLowerCase();
    const duplicate = existingLibrary.find(
      (game) =>
        game.id !== editingGameId &&
        game.title.trim().toLowerCase() === normalizedCandidate
    );
    if (duplicate) {
      errors.title = `Este jogo ("${duplicate.title}") já está cadastrado na sua biblioteca.`;
    }
  }

  const trimmedGenre = (input.genre ?? '').trim();
  if (!trimmedGenre) {
    errors.genre = 'Informe o gênero do jogo.';
  } else if (trimmedGenre.length > 100) {
    errors.genre = 'O gênero deve ter no máximo 100 caracteres.';
  }

  const trimmedPlatform = (input.platform ?? '').trim();
  if (!trimmedPlatform) {
    errors.platform = 'Informe a plataforma.';
  } else if (trimmedPlatform.length > 100) {
    errors.platform = 'A plataforma deve ter no máximo 100 caracteres.';
  }

  if (!GAME_STATUSES.includes(input.status as GameStatus)) {
    errors.status = 'Selecione um status válido (Jogando, Zerei, Quero Jogar ou Abandonei).';
  }

  if (input.rating !== null && input.rating !== undefined) {
    if (!Number.isFinite(input.rating) || input.rating < 0 || input.rating > 10) {
      errors.rating = 'A nota deve estar entre 0 e 10.';
    }
  }

  const hours = input.hours_played ?? 0;
  if (!Number.isFinite(hours) || hours < 0 || hours > 99999) {
    errors.hours_played = 'As horas jogadas devem ser um número entre 0 e 99.999.';
  }

  if (input.completed_at) {
    if (!isValidIsoDate(input.completed_at)) {
      errors.completed_at = 'Informe uma data de conclusão válida (AAAA-MM-DD).';
    }
  }

  if (input.release_date) {
    if (!isValidIsoDate(input.release_date)) {
      errors.release_date = 'Informe uma data de lançamento válida (AAAA-MM-DD).';
    }
  }

  if (input.cover_url && input.cover_url.trim().length > 250000) {
    errors.cover_url = 'A URL/imagem da capa excede o tamanho técnico permitido.';
  }

  if (input.description && input.description.length > 5000) {
    errors.description = 'A descrição deve ter no máximo 5.000 caracteres.';
  }

  if (input.developer && input.developer.length > 160) {
    errors.developer = 'A desenvolvedora deve ter no máximo 160 caracteres.';
  }

  if (input.personal_notes && input.personal_notes.length > 4000) {
    errors.personal_notes = 'As anotações pessoais devem ter no máximo 4.000 caracteres.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateUsernameFormat(username: string): string | null {
  const cleaned = username.trim();
  if (!cleaned) return 'Informe um nome de usuário.';
  if (cleaned.length < 3) return 'O nome de usuário deve ter pelo menos 3 caracteres.';
  if (cleaned.length > 30) return 'O nome de usuário deve ter no máximo 30 caracteres.';
  if (!/^[a-zA-Z0-9_.-]+$/.test(cleaned)) {
    return 'Use apenas letras, números, ponto (.), hífen (-) ou sublinhado (_).';
  }
  return null;
}
