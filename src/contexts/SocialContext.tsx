'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSocialOverview,
  listMyConversations,
} from '@/services/socialService';
import {
  ConversationSummary,
  FriendEntry,
  FriendRequestEntry,
} from '@/types/social';

interface SocialContextValue {
  friends: FriendEntry[];
  incomingRequests: FriendRequestEntry[];
  conversations: ConversationSummary[];
  pendingIncomingCount: number;
  unreadMessagesCount: number;
  friendsCount: number;
  refreshSocialCounts: () => Promise<void>;
}

const SocialContext = createContext<SocialContextValue>({
  friends: [],
  incomingRequests: [],
  conversations: [],
  pendingIncomingCount: 0,
  unreadMessagesCount: 0,
  friendsCount: 0,
  refreshSocialCounts: async () => {},
});

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<
    FriendRequestEntry[]
  >([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [pendingIncomingCount, setPendingIncomingCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);

  const refreshSocialCounts = useCallback(async () => {
    if (!user) {
      setFriends([]);
      setIncomingRequests([]);
      setConversations([]);
      setPendingIncomingCount(0);
      setUnreadMessagesCount(0);
      setFriendsCount(0);
      return;
    }

    try {
      const [overview, convs] = await Promise.all([
        getSocialOverview(),
        listMyConversations(),
      ]);
      setFriends(overview.friends);
      setIncomingRequests(overview.incoming_requests);
      setConversations(convs);
      setPendingIncomingCount(overview.incoming_requests.length);
      setFriendsCount(overview.friends.length);
      const totalUnread = convs.reduce(
        (sum, conv) => sum + (Number(conv.unread_count) || 0),
        0
      );
      setUnreadMessagesCount(totalUnread);
    } catch {
      // Quietly ignore transient network hiccups
    }
  }, [user]);

  useEffect(() => {
    refreshSocialCounts();
  }, [refreshSocialCounts]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`tgc-social-counts-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        () => {
          refreshSocialCounts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_messages' },
        () => {
          refreshSocialCounts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_members' },
        () => {
          refreshSocialCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshSocialCounts]);

  const value = useMemo(
    () => ({
      friends,
      incomingRequests,
      conversations,
      pendingIncomingCount,
      unreadMessagesCount,
      friendsCount,
      refreshSocialCounts,
    }),
    [
      friends,
      incomingRequests,
      conversations,
      pendingIncomingCount,
      unreadMessagesCount,
      friendsCount,
      refreshSocialCounts,
    ]
  );

  return (
    <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
  );
}

export function useSocial() {
  return useContext(SocialContext);
}
