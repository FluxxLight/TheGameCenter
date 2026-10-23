import { supabase } from '@/lib/supabase/client';
import {
  ConversationMessage,
  ConversationSummary,
  ConversationThread,
  PlayerLookupResult,
  SocialOverview,
} from '@/types/social';

function cleanRpcError(error: { message?: string } | null, fallback: string): Error {
  if (!error?.message) return new Error(fallback);
  const msg = error.message
    .replace(/^ERROR:\s*/i, '')
    .replace(/^ACESSO_NEGADO:\s*/i, '')
    .replace(/^PERMISSAO_NEGADA:\s*/i, '')
    .trim();
  return new Error(msg || fallback);
}

export async function findPlayerByCode(
  code: string
): Promise<PlayerLookupResult | null> {
  const cleaned = code.trim();
  if (!cleaned) return null;

  const { data, error } = await supabase.rpc('find_player_by_code', {
    p_code: cleaned,
  });

  if (error) {
    throw cleanRpcError(error, 'Erro ao buscar jogador pelo código.');
  }

  if (!data) return null;
  return data as PlayerLookupResult;
}

export async function sendFriendRequest(targetUserId: string): Promise<void> {
  const { error } = await supabase.rpc('send_friend_request', {
    p_target_user_id: targetUserId,
  });

  if (error) {
    throw cleanRpcError(error, 'Não foi possível enviar a solicitação de amizade.');
  }
}

export async function respondFriendRequest(
  friendshipId: string,
  decision: 'accepted' | 'declined'
): Promise<void> {
  const { error } = await supabase.rpc('respond_friend_request', {
    p_friendship_id: friendshipId,
    p_decision: decision,
  });

  if (error) {
    throw cleanRpcError(error, 'Não foi possível responder à solicitação.');
  }
}

export async function removeFriendship(friendshipId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_friendship', {
    p_friendship_id: friendshipId,
  });

  if (error) {
    throw cleanRpcError(error, 'Erro ao remover vínculo de amizade.');
  }
}

export async function getSocialOverview(): Promise<SocialOverview> {
  const { data, error } = await supabase.rpc('get_social_overview');

  if (error) {
    throw cleanRpcError(error, 'Erro ao carregar lista de amigos e solicitações.');
  }

  const raw = (data ?? {}) as Partial<SocialOverview>;
  return {
    friends: Array.isArray(raw.friends) ? raw.friends : [],
    incoming_requests: Array.isArray(raw.incoming_requests)
      ? raw.incoming_requests
      : [],
    outgoing_requests: Array.isArray(raw.outgoing_requests)
      ? raw.outgoing_requests
      : [],
  };
}

export async function openOrCreateDirectConversation(
  friendId: string
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'open_or_create_direct_conversation',
    {
      p_friend_id: friendId,
    }
  );

  if (error || !data) {
    throw cleanRpcError(error, 'Não foi possível iniciar a conversa privada.');
  }

  return String(data);
}

export async function createGroupConversation(params: {
  name: string;
  memberIds: string[];
  description?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_group_conversation', {
    p_name: params.name.trim(),
    p_member_ids: params.memberIds,
    p_description: params.description?.trim() ?? '',
  });

  if (error || !data) {
    throw cleanRpcError(error, 'Não foi possível criar o grupo.');
  }

  return String(data);
}

export async function updateGroupInfo(params: {
  conversationId: string;
  name: string;
  description?: string;
}): Promise<void> {
  const { error } = await supabase.rpc('update_group_info', {
    p_conversation_id: params.conversationId,
    p_name: params.name.trim(),
    p_description: params.description?.trim() ?? '',
  });

  if (error) {
    throw cleanRpcError(error, 'Não foi possível atualizar os dados do grupo.');
  }
}

export async function addGroupMembers(
  conversationId: string,
  friendIds: string[]
): Promise<number> {
  const { data, error } = await supabase.rpc('add_group_members', {
    p_conversation_id: conversationId,
    p_friend_ids: friendIds,
  });

  if (error) {
    throw cleanRpcError(error, 'Erro ao adicionar amigos ao grupo.');
  }

  return Number(data ?? 0);
}

export async function removeGroupMember(
  conversationId: string,
  targetUserId: string
): Promise<void> {
  const { error } = await supabase.rpc('remove_group_member', {
    p_conversation_id: conversationId,
    p_target_user_id: targetUserId,
  });

  if (error) {
    throw cleanRpcError(error, 'Não foi possível remover o participante.');
  }
}

export async function leaveGroupConversation(
  conversationId: string
): Promise<void> {
  const { error } = await supabase.rpc('leave_group_conversation', {
    p_conversation_id: conversationId,
  });

  if (error) {
    throw cleanRpcError(error, 'Não foi possível sair do grupo.');
  }
}

export async function listMyConversations(): Promise<ConversationSummary[]> {
  const { data, error } = await supabase.rpc('list_my_conversations');

  if (error) {
    throw cleanRpcError(error, 'Erro ao listar conversas.');
  }

  return Array.isArray(data) ? (data as ConversationSummary[]) : [];
}

export async function getConversationThread(
  conversationId: string,
  limit = 200
): Promise<ConversationThread> {
  const { data, error } = await supabase.rpc('get_conversation_thread', {
    p_conversation_id: conversationId,
    p_limit: limit,
  });

  if (error || !data) {
    throw cleanRpcError(
      error,
      'Você não tem acesso a esta conversa ou ela não existe.'
    );
  }

  return data as ConversationThread;
}

export async function sendConversationMessage(
  conversationId: string,
  body: string
): Promise<ConversationMessage> {
  const { data, error } = await supabase.rpc('send_conversation_message', {
    p_conversation_id: conversationId,
    p_body: body,
  });

  if (error || !data) {
    throw cleanRpcError(error, 'Falha ao enviar mensagem.');
  }

  return data as ConversationMessage;
}

export async function markConversationRead(
  conversationId: string
): Promise<void> {
  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  });

  if (error) {
    // Non-fatal in background read sync
    console.warn('Aviso ao marcar leitura:', error.message);
  }
}
