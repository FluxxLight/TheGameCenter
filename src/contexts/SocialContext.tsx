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

interface SocialContextValue {
  pendingIncomingCount: number;
  unreadMessagesCount: number;
  friendsCount: number;
  refreshSocialCounts: () => Promise<void>;
}

const SocialContext = createContext<SocialContextValue>({
  pendingIncomingCount: 0,
  unreadMessagesCount: 0,
  friendsCount: 0,
  refreshSocialCounts: async () => {},
});

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pendingIncomingCount, setPendingIncomingCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);

  const refreshSocialCounts = useCallback(async () => {
    if (!user) {
      setPendingIncomingCount(0);
      setUnreadMessagesCount(0);
      setFriendsCount(0);
      return;
    }

    try {
      const [overview, conversations] = await Promise.all([
        getSocialOverview(),
        listMyConversations(),
      ]);
      setPendingIncomingCount(overview.incoming_requests.length);
      setFriendsCount(overview.friends.length);
      const totalUnread = conversations.reduce(
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
      pendingIncomingCount,
      unreadMessagesCount,
      friendsCount,
      refreshSocialCounts,
    }),
    [pendingIncomingCount, unreadMessagesCount, friendsCount, refreshSocialCounts]
  );

  return (
    <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
  );
}

export function useSocial() {
  return useContext(SocialContext);
}
