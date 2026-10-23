export type RelationshipStatus =
  | 'self'
  | 'none'
  | 'friends'
  | 'outgoing_pending'
  | 'incoming_pending';

export interface PublicPlayerProfile {
  id: string;
  username: string;
  display_name: string;
  player_code: string;
  avatar_url: string | null;
  bio: string;
  favorite_platform: string;
  favorite_genre: string;
  created_at?: string;
}

export interface PlayerLookupResult extends PublicPlayerProfile {
  relationship_status: RelationshipStatus;
  friendship_id: string | null;
}

export interface FriendEntry {
  friendship_id: string;
  since: string;
  user: PublicPlayerProfile;
}

export interface FriendRequestEntry {
  friendship_id: string;
  created_at: string;
  user: PublicPlayerProfile;
}

export interface SocialOverview {
  friends: FriendEntry[];
  incoming_requests: FriendRequestEntry[];
  outgoing_requests: FriendRequestEntry[];
}

export type ConversationKind = 'direct' | 'group';
export type MemberRole = 'owner' | 'admin' | 'member';
export type MessageType = 'user' | 'system';

export interface ConversationParticipant extends PublicPlayerProfile {
  role: MemberRole;
  joined_at: string;
}

export interface ConversationSummary {
  id: string;
  kind: ConversationKind;
  name: string | null;
  description: string;
  created_by: string | null;
  last_message_at: string | null;
  last_message_preview: string;
  created_at: string;
  updated_at: string;
  my_role: MemberRole;
  last_read_at: string;
  can_send: boolean;
  unread_count: number;
  participants: ConversationParticipant[];
}

export interface MessageSenderSummary {
  id: string;
  username: string;
  display_name: string;
  player_code: string;
  avatar_url: string | null;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  message_type: MessageType;
  created_at: string;
  sender: MessageSenderSummary;
}

export interface ConversationThread {
  conversation: Omit<ConversationSummary, 'unread_count'>;
  messages: ConversationMessage[];
}
