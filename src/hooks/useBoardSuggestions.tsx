import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface DatabaseBoard {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  is_public: boolean;
  member_limit: number | null;
  location: string | null;
  location_scope: string;
  requires_approval: boolean;
  auto_approve_members: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface DiscussionBoard {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  is_public: boolean;
  member_limit: number | null;
  location: string | null;
  location_scope: 'neighborhood' | 'city' | 'state' | 'public';
  requires_approval: boolean;
  auto_approve_members: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  member_count: number;
  user_role: string | null;
}

export const useBoardSuggestions = (limit: number = 3) => {
  const [suggestions, setSuggestions] = useState<DiscussionBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { profile } = useProfile();

  const fetchBoardSuggestions = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    try {
      // Get boards user is already a member of
      const { data: memberData } = await supabase
        .from('board_members')
        .select('board_id')
        .eq('user_id', user.id);

      const userBoardIds = memberData?.map(m => m.board_id) || [];

      // Build location-based suggestions
      const suggestions: any[] = [];
      
      // 1. Neighborhood boards first (highest priority)
      if (profile.neighborhood) {
        const { data: neighborhoodBoards } = await supabase
          .from('discussion_boards')
          .select('*')
          .eq('is_public', true)
          .eq('location_scope', 'neighborhood')
          .ilike('location', `%${profile.neighborhood}%`)
          .not('id', 'in', userBoardIds.length > 0 ? `(${userBoardIds.join(',')})` : '()')
          .order('created_at', { ascending: false })
          .limit(2);

        if (neighborhoodBoards) {
          suggestions.push(...neighborhoodBoards);
        }
      }

      // 2. City boards (medium priority)
      if (profile.city && suggestions.length < limit) {
        const { data: cityBoards } = await supabase
          .from('discussion_boards')
          .select('*')
          .eq('is_public', true)
          .eq('location_scope', 'city')
          .ilike('location', `%${profile.city}%`)
          .not('id', 'in', userBoardIds.length > 0 ? `(${userBoardIds.join(',')})` : '()')
          .order('created_at', { ascending: false })
          .limit(limit - suggestions.length);

        if (cityBoards) {
          suggestions.push(...cityBoards);
        }
      }

      // 3. State boards (lower priority)
      if (profile.state && suggestions.length < limit) {
        const { data: stateBoards } = await supabase
          .from('discussion_boards')
          .select('*')
          .eq('is_public', true)
          .eq('location_scope', 'state')
          .ilike('location', `%${profile.state}%`)
          .not('id', 'in', userBoardIds.length > 0 ? `(${userBoardIds.join(',')})` : '()')
          .order('created_at', { ascending: false })
          .limit(limit - suggestions.length);

        if (stateBoards) {
          suggestions.push(...stateBoards);
        }
      }

      // 4. Public boards (lowest priority, fill remaining slots)
      if (suggestions.length < limit) {
        const { data: publicBoards } = await supabase
          .from('discussion_boards')
          .select('*')
          .eq('is_public', true)
          .eq('location_scope', 'public')
          .not('id', 'in', userBoardIds.length > 0 ? `(${userBoardIds.join(',')})` : '()')
          .order('created_at', { ascending: false })
          .limit(limit - suggestions.length);

        if (publicBoards) {
          suggestions.push(...publicBoards);
        }
      }

      // Get member counts and user roles for each suggestion
      const boardsWithDetails = await Promise.all(
        suggestions.map(async (board) => {
          const { count } = await supabase
            .from('board_members')
            .select('*', { count: 'exact' })
            .eq('board_id', board.id);

          // Check if user is a member and their role
          const { data: memberData } = await supabase
            .from('board_members')
            .select('role')
            .eq('board_id', board.id)
            .eq('user_id', user.id)
            .single();

          return {
            ...board,
            location_scope: board.location_scope as 'neighborhood' | 'city' | 'state' | 'public',
            member_count: count || 0,
            user_role: memberData?.role || null
          } as DiscussionBoard;
        })
      );

      setSuggestions(boardsWithDetails);
    } catch (error) {
      console.error('Error fetching board suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardSuggestions();
  }, [user, profile]);

  const refreshSuggestions = () => {
    fetchBoardSuggestions();
  };

  return {
    suggestions,
    loading,
    refreshSuggestions
  };
};