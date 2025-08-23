import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OnlineAvatar from '@/components/OnlineAvatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare,
  Send,
  Pin,
  Users,
  Crown,
  Heart,
  Reply,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  Globe,
  Hash,
  AtSign,
  X,
  Settings,
  ArrowLeft,
  Shield,
  Copy,
  RefreshCw,
  Trash2,
  CheckCircle,
  Check,
  Paperclip,
  ThumbsUp,
  Smile,
  Link,
  Calendar,
  Eye,
  EyeOff,
  UserPlus,
  UserCheck,
  UserX,
  Ban
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';

interface DiscussionBoard {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  is_public: boolean;
  is_private: boolean;
  discoverable: boolean;
  allow_member_list: boolean;
  allow_member_invites: boolean;
  member_limit: number | null;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
  location: string | null;
  location_scope: 'neighborhood' | 'city' | 'state' | 'public';
  requires_approval: boolean;
  auto_approve_members: boolean;
  member_count: number;
  user_role: string | null;
  allow_member_posting?: boolean;
  require_approval?: boolean;
}

interface JoinRequest {
  id: string;
  board_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
    state: string | null;
  } | null;
}

interface UserSearchResult {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
}

interface BoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  status: string;
  joined_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
    state: string | null;
  } | null;
}

interface InviteLink {
  id: string;
  board_id: string;
  token: string;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

interface BoardPost {
  id: string;
  board_id: string;
  user_id: string;
  content: string;
  post_type: string;
  image_urls: string[];
  attachments?: Json; // Store as JSON from database
  reply_to_id: string | null;
  is_pinned: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  edited_at?: string;
  message_type?: string;
  thread_id?: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  } | null;
  likes_count: number;
  is_liked_by_user: boolean;
  reactions?: Array<{
    id: string;
    user_id: string;
    reaction: string;
    created_at: string;
  }>;
  tagged_members?: string[];
}

const CommunityBoards = () => {
  const isMobile = useIsMobile();
  const [showMobileConversation, setShowMobileConversation] = useState(false);
  const [boards, setBoards] = useState<DiscussionBoard[]>([]);
  const [publicBoards, setPublicBoards] = useState<DiscussionBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<Array<{
    id: string;
    type: 'image' | 'video' | 'file';
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showDiscoverBoards, setShowDiscoverBoards] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newBoardIsPublic, setNewBoardIsPublic] = useState(true);
  const [showingDiscoveredBoards, setShowingDiscoveredBoards] = useState(false);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [showInviteLinks, setShowInviteLinks] = useState(false);
  const [newInviteExpiry, setNewInviteExpiry] = useState<string>('');
  const [newInviteMaxUses, setNewInviteMaxUses] = useState<string>('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<BoardMember[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [taggedMembers, setTaggedMembers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { uploadFile, uploading } = useFileUpload(user?.id || '');

  // Create a new board
  const createBoard = async () => {
    if (!user || !newBoardName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('discussion_boards')
        .insert({
          name: newBoardName.trim(),
          description: newBoardDescription.trim() || null,
          creator_id: user.id,
          is_public: newBoardIsPublic,
          location_scope: 'public'
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase
        .from('board_members')
        .insert({
          board_id: data.id,
          user_id: user.id,
          role: 'admin'
        });

      setNewBoardName('');
      setNewBoardDescription('');
      setShowCreateBoard(false);
      fetchBoards();

      toast({
        title: "Board created!",
        description: `${data.name} has been created successfully.`,
      });
    } catch (error) {
      console.error('Error creating board:', error);
      toast({
        title: "Error",
        description: "Failed to create board. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch discussion boards
  const fetchBoards = async () => {
    if (!user) return;
    
    try {
      const { data: membershipData, error: membershipError } = await supabase
        .from('board_members')
        .select('board_id, role')
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      if (!membershipData || membershipData.length === 0) {
        setBoards([]);
        return;
      }

      const boardIds = membershipData.map(m => m.board_id);

      const { data: boardsData, error: boardsError } = await supabase
        .from('discussion_boards')
        .select('*')
        .in('id', boardIds)
        .order('updated_at', { ascending: false });

      if (boardsError) throw boardsError;

      const boardsWithCounts = await Promise.all(
        (boardsData || []).map(async (board) => {
          const { count } = await supabase
            .from('board_members')
            .select('*', { count: 'exact' })
            .eq('board_id', board.id);

          const userMembership = membershipData.find(m => m.board_id === board.id);

          return {
            ...board,
            member_count: count || 0,
            user_role: userMembership?.role || null
          };
        })
      );

      setBoards(boardsWithCounts as DiscussionBoard[]);
      
      if (!selectedBoard && boardsWithCounts.length > 0) {
        setSelectedBoard(boardsWithCounts[0].id);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
      toast({
        title: "Error",
        description: "Failed to load discussion boards.",
        variant: "destructive",
      });
    }
  };

  // Fetch public boards
  const fetchPublicBoards = async () => {
    if (!user?.id) return;

    try {
      const { data: publicBoardsData, error } = await supabase
        .from('discussion_boards')
        .select(`*, creator:profiles!discussion_boards_creator_id_fkey(full_name, avatar_url)`)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const boardsWithCounts = await Promise.all(
        (publicBoardsData || []).map(async (board) => {
          const { count } = await supabase
            .from('board_members')
            .select('*', { count: 'exact' })
            .eq('board_id', board.id);

          const { data: memberData } = await supabase
            .from('board_members')
            .select('role')
            .eq('board_id', board.id)
            .eq('user_id', user.id)
            .single();

          return {
            ...board,
            member_count: count || 0,
            user_role: memberData?.role || null
          };
        })
      );

      setPublicBoards(boardsWithCounts as DiscussionBoard[]);
    } catch (error) {
      console.error('Error fetching public boards:', error);
    }
  };

  // Join a board
  const joinBoard = async (boardId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('board_members')
        .insert({
          board_id: boardId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: "Joined board!",
        description: "You've successfully joined the board.",
      });

      fetchBoards();
      fetchPublicBoards();
    } catch (error) {
      console.error('Error joining board:', error);
      toast({
        title: "Error",
        description: "Failed to join board.",
        variant: "destructive",
      });
    }
  };

  // Fetch posts for selected board
  const fetchPosts = async () => {
    if (!selectedBoard) return;

    try {
      const { data, error } = await supabase
        .from('board_posts')
        .select(`
          *,
          profiles!user_id (
            full_name,
            avatar_url,
            neighborhood,
            city,
            state
          )
        `)
        .eq('board_id', selectedBoard)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const postsWithLikes = await Promise.all(
        (data || []).map(async (post) => {
          const { count } = await supabase
            .from('board_post_likes')
            .select('*', { count: 'exact' })
            .eq('post_id', post.id);

          const { data: userLike } = await supabase
            .from('board_post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user?.id)
            .single();

          // Fetch reactions for this post
          const { data: reactions } = await supabase
            .from('board_post_reactions')
            .select('*')
            .eq('post_id', post.id);

          return {
            ...post,
            profiles: post.profiles || {
              full_name: null,
              avatar_url: null,
              neighborhood: null,
              city: null,
              state: null
            },
            likes_count: count || 0,
            is_liked_by_user: !!userLike,
            reactions: reactions || []
          };
        })
      );

      setPosts(postsWithLikes as BoardPost[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  // Send message with attachments
  const sendMessage = async () => {
    if (!selectedBoard || (!newMessage.trim() && pendingAttachments.length === 0) || !user) return;

    try {
      const insertData: any = {
        board_id: selectedBoard,
        user_id: user.id,
        content: newMessage.trim(),
        post_type: 'message',
        tagged_members: taggedMembers
      };

      // Add attachments if there are any
      if (pendingAttachments.length > 0) {
        insertData.attachments = pendingAttachments;
      }

      const { error } = await supabase
        .from('board_posts')
        .insert(insertData);

      if (error) throw error;

      setNewMessage('');
      setPendingAttachments([]);
      setTaggedMembers([]);
      fetchPosts();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const attachment = await uploadFile(file);
        if (attachment) {
          setPendingAttachments(prev => [...prev, attachment]);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }
    
    // Reset input
    event.target.value = '';
  };

  // Remove pending attachment
  const removePendingAttachment = (attachmentId: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  // Toggle pin message
  const togglePinMessage = async (postId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('board_posts')
        .update({ is_pinned: !isPinned })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: isPinned ? "Message unpinned" : "Message pinned",
        description: isPinned ? "Message has been unpinned" : "Message has been pinned to the top",
      });

      fetchPosts();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "Error",
        description: "Failed to update message pin status",
        variant: "destructive",
      });
    }
  };

  // Add reaction to message
  const addReaction = async (postId: string, reaction: string) => {
    if (!user) return;

    try {
      // First check if user already has this reaction
      const { data: existingReaction } = await supabase
        .from('board_post_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('reaction', reaction)
        .single();

      if (existingReaction) {
        // If reaction exists, remove it instead
        await removeReaction(postId, reaction);
        return;
      }

      // Insert new reaction
      const { error } = await supabase
        .from('board_post_reactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction: reaction
        });

      if (error) throw error;

      fetchPosts();
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    }
  };

  // Remove reaction from message
  const removeReaction = async (postId: string, reaction: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('board_post_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('reaction', reaction);

      if (error) throw error;

      fetchPosts();
    } catch (error) {
      console.error('Error removing reaction:', error);
      toast({
        title: "Error",
        description: "Failed to remove reaction",
        variant: "destructive",
      });
    }
  };

  // Fetch board members
  const fetchBoardMembers = async () => {
    if (!selectedBoard) return;

    try {
      // Fetch board members with basic info first
      const { data: memberData, error: memberError } = await supabase
        .from('board_members')
        .select('*')
        .eq('board_id', selectedBoard)
        .eq('status', 'active')
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });

      if (memberError) throw memberError;

      if (!memberData) {
        setBoardMembers([]);
        return;
      }

      // Fetch profile data separately
      const userIds = memberData.map(m => m.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, city, state')
        .in('user_id', userIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
      }

      // Combine the data
      const formattedMembers: BoardMember[] = memberData.map(member => ({
        ...member,
        role: member.role as 'admin' | 'moderator' | 'member',
        profiles: profileData?.find(p => p.user_id === member.user_id) || null
      }));
      
      setBoardMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching board members:', error);
    }
  };

  // Update board settings
  const updateBoardSettings = async (settings: Partial<DiscussionBoard>) => {
    if (!selectedBoard) return;

    try {
      const { error } = await supabase
        .from('discussion_boards')
        .update(settings)
        .eq('id', selectedBoard);

      if (error) throw error;

      toast({
        title: "Settings updated",
        description: "Board settings have been updated successfully.",
      });
      
      fetchBoards();
    } catch (error) {
      console.error('Error updating board settings:', error);
      toast({
        title: "Error",
        description: "Failed to update board settings.",
        variant: "destructive",
      });
    }
  };

  // Fetch invite links
  const fetchInviteLinks = async () => {
    if (!selectedBoard) return;

    try {
      const { data, error } = await supabase
        .from('group_invites')
        .select('*')
        .eq('board_id', selectedBoard)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInviteLinks(data || []);
    } catch (error) {
      console.error('Error fetching invite links:', error);
    }
  };

  // Create invite link
  const createInviteLink = async () => {
    if (!selectedBoard || !user) return;

    try {
      const insertData: any = {
        board_id: selectedBoard,
        created_by: user.id,
      };

      if (newInviteExpiry) {
        const expiryDate = new Date();
        const days = parseInt(newInviteExpiry);
        expiryDate.setDate(expiryDate.getDate() + days);
        insertData.expires_at = expiryDate.toISOString();
      }

      if (newInviteMaxUses) {
        insertData.max_uses = parseInt(newInviteMaxUses);
      }

      const { data, error } = await supabase
        .from('group_invites')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Invite link created",
        description: "A new invite link has been generated.",
      });

      setNewInviteExpiry('');
      setNewInviteMaxUses('');
      fetchInviteLinks();
    } catch (error) {
      console.error('Error creating invite link:', error);
      toast({
        title: "Error",
        description: "Failed to create invite link.",
        variant: "destructive",
      });
    }
  };

  // Deactivate invite link
  const deactivateInviteLink = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('group_invites')
        .update({ is_active: false })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: "Invite link deactivated",
        description: "The invite link has been deactivated.",
      });

      fetchInviteLinks();
    } catch (error) {
      console.error('Error deactivating invite link:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate invite link.",
        variant: "destructive",
      });
    }
  };

  // Copy invite link to clipboard
  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/community?invite=${token}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Link copied",
        description: "Invite link has been copied to clipboard.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Search for users to add
  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setUserSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, city, state')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setUserSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Add member directly
  const addMemberDirectly = async (userId: string) => {
    if (!selectedBoard || !user) return;

    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('board_members')
        .select('id')
        .eq('board_id', selectedBoard)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        toast({
          title: "Error",
          description: "User is already a member of this board.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('board_members')
        .insert({
          board_id: selectedBoard,
          user_id: userId,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: "Member added",
        description: "User has been added to the board successfully.",
      });

      setShowAddMember(false);
      setUserSearchQuery('');
      setUserSearchResults([]);
      fetchBoardMembers();
      fetchBoards(); // Refresh to update member count
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add member to board.",
        variant: "destructive",
      });
    }
  };

  // Remove member
  const removeMember = async (memberId: string, memberUserId: string) => {
    if (!selectedBoard || !user) return;

    // Don't allow removing the board creator
    if (currentBoard?.creator_id === memberUserId) {
      toast({
        title: "Cannot remove creator",
        description: "The board creator cannot be removed.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('board_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: "Member has been removed from the board.",
      });

      fetchBoardMembers();
      fetchBoards(); // Refresh to update member count
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member.",
        variant: "destructive",
      });
    }
  };

  // Update member role
  const updateMemberRole = async (memberId: string, newRole: 'admin' | 'moderator' | 'member') => {
    if (!selectedBoard || !user) return;

    try {
      const { error } = await supabase
        .from('board_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "Member role has been updated successfully.",
      });

      fetchBoardMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role.",
        variant: "destructive",
      });
    }
  };

  // Handle mention input detection
  const handleMentionInput = (value: string, position: number) => {
    const beforeCursor = value.substring(0, position);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setCursorPosition(position);
      setShowMentionDropdown(true);
      searchBoardMembersForMention(query);
    } else {
      setShowMentionDropdown(false);
      setMentionSuggestions([]);
    }
  };

  // Search board members for mentions
  const searchBoardMembersForMention = (query: string) => {
    if (!selectedBoard) return;
    
    const filteredMembers = boardMembers.filter(member => 
      member.profiles?.full_name?.toLowerCase().includes(query.toLowerCase()) ||
      member.profiles?.full_name?.toLowerCase().startsWith(query.toLowerCase())
    );
    
    setMentionSuggestions(filteredMembers.slice(0, 5)); // Limit to 5 suggestions
  };

  // Insert mention into message
  const insertMention = (member: BoardMember) => {
    if (!messageInputRef.current) return;
    
    const beforeCursor = newMessage.substring(0, cursorPosition);
    const afterCursor = newMessage.substring(cursorPosition);
    const beforeMention = beforeCursor.replace(/@\w*$/, '');
    const mentionText = `@${member.profiles?.full_name} `;
    
    const newMessageText = beforeMention + mentionText + afterCursor;
    setNewMessage(newMessageText);
    
    // Add to tagged members
    if (!taggedMembers.includes(member.user_id)) {
      setTaggedMembers([...taggedMembers, member.user_id]);
    }
    
    setShowMentionDropdown(false);
    setMentionSuggestions([]);
    
    // Focus back to input and set cursor position
    setTimeout(() => {
      if (messageInputRef.current) {
        const newPosition = beforeMention.length + mentionText.length;
        messageInputRef.current.focus();
        messageInputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  // Handle input change for mentions
  const handleMessageInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    
    setNewMessage(value);
    handleMentionInput(value, position);
  };

  // Handle key events for mention dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionDropdown && mentionSuggestions.length > 0) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        // For simplicity, auto-select first suggestion on Enter
        if (e.key === 'Enter') {
          insertMention(mentionSuggestions[0]);
        }
      }
      if (e.key === 'Escape') {
        setShowMentionDropdown(false);
      }
    }
  };

  // Render message content with highlighted mentions
  const renderMessageWithMentions = (content: string) => {
    // Split content by @ mentions and render them differently
    const parts = content.split(/(@[^@\s]+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const mentionName = part.substring(1).trim();
        return (
          <span
            key={index}
            className="inline-flex items-center px-1 py-0.5 rounded bg-primary/10 text-primary font-medium text-sm"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Fetch join requests
  const fetchJoinRequests = async () => {
    if (!selectedBoard) return;

    try {
      // Fetch join requests first
      const { data: requestsData, error: requestsError } = await supabase
        .from('board_join_requests')
        .select('*')
        .eq('board_id', selectedBoard)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (!requestsData || requestsData.length === 0) {
        setJoinRequests([]);
        return;
      }

      // Get user IDs for profile lookup
      const userIds = requestsData.map(request => request.user_id);

      // Fetch profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, city, state')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const joinRequestsWithProfiles = requestsData.map(request => ({
        ...request,
        status: request.status as 'pending' | 'approved' | 'rejected',
        profiles: profilesData?.find(profile => profile.user_id === request.user_id) || null
      }));

      setJoinRequests(joinRequestsWithProfiles);
    } catch (error) {
      console.error('Error fetching join requests:', error);
    }
  };

  // Handle join request
  const handleJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('board_join_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: action === 'approve' ? "Request approved" : "Request rejected",
        description: `Join request has been ${action}d.`,
      });

      fetchJoinRequests();
      if (action === 'approve') {
        fetchBoardMembers();
        fetchBoards(); // Refresh to update member count
      }
    } catch (error) {
      console.error('Error handling join request:', error);
      toast({
        title: "Error",
        description: "Failed to process join request.",
        variant: "destructive",
      });
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Check if user is admin or moderator
  const isAdminOrModerator = (board: DiscussionBoard) => {
    return board.user_role === 'admin' || board.user_role === 'moderator' || board.creator_id === user?.id;
  };

  // Real-time setup
  useEffect(() => {
    if (!selectedBoard) return;

    const channel = supabase
      .channel(`board_posts_${selectedBoard}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_posts',
          filter: `board_id=eq.${selectedBoard}`,
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBoard]);

  useEffect(() => {
    if (user) {
      fetchBoards();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBoard) {
      fetchPosts();
      fetchBoardMembers();
      fetchJoinRequests();
      scrollToBottom();
    }
  }, [selectedBoard]);

  useEffect(() => {
    scrollToBottom();
  }, [posts]);

  const currentBoard = boards.find(b => b.id === selectedBoard);
  const displayBoards = showingDiscoveredBoards ? publicBoards : boards;

  // Mobile back button handler
  const handleMobileBack = () => {
    setShowMobileConversation(false);
    setSelectedBoard(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-12rem)] bg-background overflow-hidden">
      {/* Boards Sidebar - hide on mobile when conversation is shown */}
      <div className={`w-full md:w-80 border-b md:border-r md:border-b-0 bg-card flex-shrink-0 ${
        isMobile && showMobileConversation ? 'hidden' : ''
      }`}>
        <div className="p-4 space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant={showingDiscoveredBoards ? "outline" : "default"}
              size="sm"
              onClick={() => {
                if (!showingDiscoveredBoards) {
                  setShowingDiscoveredBoards(false);
                } else {
                  setShowingDiscoveredBoards(false);
                }
              }}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              My Boards
            </Button>
            <Button 
              variant={showingDiscoveredBoards ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (!showingDiscoveredBoards) {
                  fetchPublicBoards();
                }
                setShowingDiscoveredBoards(true);
              }}
              className="flex-1"
            >
              <Globe className="h-4 w-4 mr-2" />
              Discover
            </Button>
          </div>

          {/* Create Board Button */}
          <Dialog open={showCreateBoard} onOpenChange={setShowCreateBoard}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create New Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="board-name">Board Name</Label>
                  <Input
                    id="board-name"
                    placeholder="Enter board name..."
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="board-description">Description (Optional)</Label>
                  <Textarea
                    id="board-description"
                    placeholder="Describe what this board is about..."
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="board-public"
                    checked={newBoardIsPublic}
                    onCheckedChange={setNewBoardIsPublic}
                  />
                  <Label htmlFor="board-public">Make board public</Label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCreateBoard(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={createBoard} className="flex-1">
                    Create Board
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Boards List */}
        <ScrollArea className="h-[calc(100%-200px)]">
          <div className="p-4 space-y-2">
            {displayBoards.map((board) => (
              <Card 
                key={board.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedBoard === board.id ? 'bg-accent border-primary' : ''
                }`}
                onClick={() => {
                  if (board.user_role) {
                    setSelectedBoard(board.id);
                    if (isMobile) {
                      setShowMobileConversation(true);
                    }
                  }
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{board.name}</h3>
                      {board.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {board.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {board.member_count}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {board.location_scope}
                        </Badge>
                      </div>
                    </div>
                    {showingDiscoveredBoards && !board.user_role && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          joinBoard(board.id);
                        }}
                        className="ml-2"
                      >
                        Join
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area - show/hide based on mobile state */}
      <div className={`flex-1 flex flex-col bg-background ${
        isMobile && !showMobileConversation ? 'hidden' : ''
      }`}>
        {selectedBoard && currentBoard ? (
          <>
            {/* Enhanced Board Conversation Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
              <div className={`${isMobile ? 'p-2' : 'p-3'}`}>
                <div className="flex items-center justify-between">
                  {/* Mobile back button and board info */}
                  <div className="flex items-center flex-1 min-w-0">
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMobileBack}
                        className="mr-2 p-2 flex-shrink-0"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    )}
                    <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'} flex-1 min-w-0`}>
                      {/* Board Avatar */}
                      <Avatar className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} flex-shrink-0`}>
                        <AvatarImage src={currentBoard.avatar_url || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {currentBoard.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Board Details */}
                      <div className="flex-1 min-w-0">
                        <h1 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold truncate`}>{currentBoard.name}</h1>
                        <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'} text-xs text-muted-foreground`}>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            <MapPin className="h-3 w-3 mr-1" />
                            {currentBoard.location_scope}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-1.5 py-0.5 ${currentBoard.allow_member_list || isAdminOrModerator(currentBoard) ? "cursor-pointer hover:bg-accent" : ""}`}
                            onClick={() => {
                              if (currentBoard.allow_member_list || isAdminOrModerator(currentBoard)) {
                                setShowMembersList(true);
                              }
                            }}
                          >
                            <Users className="h-3 w-3 mr-1" />
                            {currentBoard.member_count}
                          </Badge>
                          {!isMobile && (
                            currentBoard.is_public ? (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                <Globe className="h-3 w-3 mr-1" />
                                Public
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                <Shield className="h-3 w-3 mr-1" />
                                Private
                              </Badge>
                            )
                          )}
                        </div>
                        {currentBoard.description && !isMobile && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {currentBoard.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Board Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isAdminOrModerator(currentBoard) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setShowBoardSettings(true)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Board Settings
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => setShowMembersList(true)}>
                             <Users className="h-4 w-4 mr-2" />
                             Manage Members
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => setShowAddMember(true)}>
                             <UserPlus className="h-4 w-4 mr-2" />
                             Add Members
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => {
                             setShowJoinRequests(true);
                             fetchJoinRequests();
                           }}>
                             <UserCheck className="h-4 w-4 mr-2" />
                             Join Requests
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => {
                             setShowInviteLinks(true);
                             fetchInviteLinks();
                           }}>
                             <Link className="h-4 w-4 mr-2" />
                             Invite Links
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Container with Enhanced Scrolling */}
            <div className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-4">
                  {/* Pinned Messages Bar */}
                  {posts.some(post => post.is_pinned) && (
                    <div className="bg-accent/50 border border-primary/20 rounded-lg p-3 mb-4 sticky top-0 z-10 bg-background/95 backdrop-blur">
                      <div className="flex items-center space-x-2 mb-2">
                        <Pin className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Pinned Messages</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto">
                        {posts.filter(post => post.is_pinned).map((pinnedPost) => (
                          <Button
                            key={pinnedPost.id}
                            variant="secondary"
                            size="sm"
                            className="whitespace-nowrap min-w-0 flex-shrink-0 max-w-[200px]"
                            onClick={() => {
                              const element = document.getElementById(`message-${pinnedPost.id}`);
                              element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                          >
                            <div className="truncate">
                              {pinnedPost.content?.slice(0, 30) || 'Message'}
                              {pinnedPost.content && pinnedPost.content.length > 30 && '...'}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {posts.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-center">
                      <div className="space-y-2">
                        <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <div 
                        key={post.id} 
                        id={`message-${post.id}`}
                        className={`flex items-start space-x-3 p-3 rounded-lg transition-colors hover:bg-accent/20 ${post.is_pinned ? 'bg-accent border border-primary/20' : ''}`}
                      >
                        {post.is_pinned && (
                          <Pin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                        )}
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={post.profiles?.avatar_url || ''} />
                          <AvatarFallback>
                            {post.profiles?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">
                              {post.profiles?.full_name || 'Unknown User'}
                            </p>
                            {post.is_pinned && (
                              <Badge variant="secondary" className="text-xs">Pinned</Badge>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(post.created_at).toLocaleTimeString()}
                            </p>
                            {/* Pin/Unpin button for members/admins */}
                            {user && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => togglePinMessage(post.id, post.is_pinned)}
                                  >
                                    <Pin className="h-4 w-4 mr-2" />
                                    {post.is_pinned ? 'Unpin' : 'Pin'} Message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          
                          {post.content && (
                            <div className="text-sm mt-1 break-words">
                              {renderMessageWithMentions(post.content)}
                            </div>
                          )}
                          
                          {/* Attachments */}
                          {post.attachments && Array.isArray(post.attachments) && post.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {(post.attachments as any[]).map((attachment: any, index: number) => (
                                <div key={attachment.id || index} className="flex items-center space-x-2 p-2 border rounded">
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                  <a 
                                    href={attachment.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex-1 truncate"
                                  >
                                    {attachment.name || 'File'}
                                  </a>
                                  <span className="text-xs text-muted-foreground">
                                    {attachment.size ? (attachment.size / 1024 / 1024).toFixed(1) + 'MB' : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tagged Members */}
                          {post.tagged_members && post.tagged_members.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>Mentioned:</span>
                                {post.tagged_members.map((memberId, index) => {
                                  const member = boardMembers.find(m => m.user_id === memberId);
                                  return member ? (
                                    <Badge key={memberId} variant="secondary" className="text-xs">
                                      {member.profiles?.full_name || 'Unknown User'}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}

                          {/* Reactions and Likes */}
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-2">
                              {/* Quick reaction buttons */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addReaction(post.id, '👍')}
                                className="h-6 px-2"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addReaction(post.id, '❤️')}
                                className="h-6 px-2"
                              >
                                <Heart className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addReaction(post.id, '😊')}
                                className="h-6 px-2"
                              >
                                <Smile className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            {/* Display reaction counts */}
                            {post.reactions && post.reactions.length > 0 && (
                              <div className="flex items-center space-x-1">
                                {Object.entries(
                                  post.reactions.reduce((acc, reaction) => {
                                    acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;
                                    return acc;
                                  }, {} as Record<string, number>)
                                ).map(([reaction, count]) => (
                                  <span key={reaction} className="text-xs bg-muted px-1 rounded">
                                    {reaction} {count}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {post.likes_count > 0 && (
                              <div className="flex items-center space-x-1">
                                <Heart className="h-3 w-3 text-red-500" />
                                <span className="text-xs text-muted-foreground">
                                  {post.likes_count}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-card">
              {/* Pending attachments preview */}
              {pendingAttachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  <p className="text-sm font-medium">Attachments:</p>
                  {pendingAttachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{attachment.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(attachment.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePendingAttachment(attachment.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {/* Mobile: Attachment and send buttons row */}
                  <div className="flex space-x-2 sm:contents">
                    {/* File attachment input */}
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-input"
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-input')?.click()}
                      disabled={uploading}
                      className="flex-shrink-0"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span className="ml-1 hidden sm:inline">Attach</span>
                    </Button>
                    
                    {/* Send button - visible on mobile, hidden on desktop in this position */}
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() && pendingAttachments.length === 0}
                      className="flex-shrink-0 sm:hidden"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                   
                  {/* Message input area */}
                  <div className="relative flex-1">
                    <Textarea
                      ref={messageInputRef}
                      placeholder="Type your message... Use @ to mention members"
                      value={newMessage}
                      onChange={handleMessageInputChange}
                      onKeyDown={handleKeyDown}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      className="min-h-[44px] max-h-32 resize-none pr-12 sm:pr-4"
                      rows={1}
                    />
                    
                    {/* Mention Dropdown */}
                    {showMentionDropdown && mentionSuggestions.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                        {mentionSuggestions.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => insertMention(member)}
                            className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-accent text-left transition-colors"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.profiles?.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {member.profiles?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {member.profiles?.full_name || 'Unknown User'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.role} • {member.profiles?.city}, {member.profiles?.state}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Send button - desktop only */}
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() && pendingAttachments.length === 0}
                    className="hidden sm:flex flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                    <span className="ml-1 hidden md:inline">Send</span>
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="space-y-4">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Select a board to start chatting</h3>
                <p className="text-sm text-muted-foreground">
                  Choose from your boards or discover new ones to join the conversation
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Board Settings Dialog */}
      <Dialog open={showBoardSettings} onOpenChange={setShowBoardSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Board Settings</DialogTitle>
          </DialogHeader>
          {currentBoard && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-member-list">Allow members to view member list</Label>
                <Switch
                  id="allow-member-list"
                  checked={currentBoard.allow_member_list}
                  onCheckedChange={(checked) => 
                    updateBoardSettings({ allow_member_list: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-member-invites">Allow members to create invites</Label>
                <Switch
                  id="allow-member-invites"
                  checked={currentBoard.allow_member_invites}
                  onCheckedChange={(checked) => 
                    updateBoardSettings({ allow_member_invites: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="discoverable">Make board discoverable</Label>
                <Switch
                  id="discoverable"
                  checked={currentBoard.discoverable}
                  onCheckedChange={(checked) => 
                    updateBoardSettings({ discoverable: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is-private">Private board (invite only)</Label>
                <Switch
                  id="is-private"
                  checked={currentBoard.is_private}
                  onCheckedChange={(checked) => 
                    updateBoardSettings({ is_private: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-member-posting">Allow members to post messages</Label>
                <Switch
                  id="allow-member-posting"
                  checked={currentBoard.allow_member_posting ?? true}
                  onCheckedChange={(checked) => 
                    updateBoardSettings({ allow_member_posting: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="require-approval">Require approval for new messages</Label>
                <Switch
                  id="require-approval"
                  checked={currentBoard.require_approval ?? false}
                  onCheckedChange={(checked) => 
                    updateBoardSettings({ require_approval: checked })
                  }
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Members List Dialog */}
      <Dialog open={showMembersList} onOpenChange={setShowMembersList}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {currentBoard?.name} Members ({boardMembers.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {boardMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {member.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {member.profiles?.full_name || 'Unknown User'}
                      </p>
                      {member.profiles?.city && (
                        <p className="text-xs text-muted-foreground">
                          {member.profiles.city}, {member.profiles.state}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        member.role === 'admin' ? 'default' : 
                        member.role === 'moderator' ? 'secondary' : 'outline'
                      }
                      className="capitalize"
                    >
                      {member.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                      {member.role === 'moderator' && <Shield className="h-3 w-3 mr-1" />}
                      {member.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-search">Search Users</Label>
              <Input
                id="user-search"
                placeholder="Search by name or email..."
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
            </div>
            
            {/* Search Results */}
            {userSearchResults.length > 0 && (
              <ScrollArea className="h-60">
                <div className="space-y-2">
                  {userSearchResults.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback>
                            {user.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {user.full_name || 'Unknown User'}
                          </p>
                          {user.city && (
                            <p className="text-xs text-muted-foreground">
                              {user.city}, {user.state}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addMemberDirectly(user.user_id)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {userSearchQuery.length >= 2 && userSearchResults.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p>No users found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Requests Dialog */}
      <Dialog open={showJoinRequests} onOpenChange={setShowJoinRequests}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Join Requests</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {joinRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-8 w-8 mx-auto mb-2" />
                  <p>No pending join requests</p>
                </div>
              ) : (
                joinRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.profiles?.avatar_url || ''} />
                          <AvatarFallback>
                            {request.profiles?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {request.profiles?.full_name || 'Unknown User'}
                          </p>
                          {request.profiles?.city && (
                            <p className="text-xs text-muted-foreground">
                              {request.profiles.city}, {request.profiles.state}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Requested: {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJoinRequest(request.id, 'reject')}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleJoinRequest(request.id, 'approve')}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                    {request.message && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <p className="font-medium">Message:</p>
                        <p>{request.message}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Enhanced Members List Dialog with Admin Controls */}
      <Dialog open={showMembersList} onOpenChange={setShowMembersList}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {currentBoard?.name} Members ({boardMembers.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {boardMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {member.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {member.profiles?.full_name || 'Unknown User'}
                      </p>
                      {member.profiles?.city && (
                        <p className="text-xs text-muted-foreground">
                          {member.profiles.city}, {member.profiles.state}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        member.role === 'admin' ? 'default' : 
                        member.role === 'moderator' ? 'secondary' : 'outline'
                      }
                      className="capitalize"
                    >
                      {member.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                      {member.role === 'moderator' && <Shield className="h-3 w-3 mr-1" />}
                      {member.role}
                    </Badge>
                    
                    {/* Admin Controls */}
                    {isAdminOrModerator(currentBoard!) && member.user_id !== currentBoard?.creator_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'member')}>
                            <Users className="h-4 w-4 mr-2" />
                            Make Member
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'moderator')}>
                            <Shield className="h-4 w-4 mr-2" />
                            Make Moderator
                          </DropdownMenuItem>
                          {currentBoard?.creator_id === user?.id && (
                            <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'admin')}>
                              <Crown className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          <Separator />
                          <DropdownMenuItem 
                            onClick={() => removeMember(member.id, member.user_id)}
                            className="text-destructive"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Invite Links Dialog */}
      <Dialog open={showInviteLinks} onOpenChange={setShowInviteLinks}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite Links</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Create New Invite */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium">Create New Invite Link</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invite-expiry">Expires in (days)</Label>
                  <Input
                    id="invite-expiry"
                    type="number"
                    placeholder="Leave empty for no expiry"
                    value={newInviteExpiry}
                    onChange={(e) => setNewInviteExpiry(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="invite-max-uses">Max uses</Label>
                  <Input
                    id="invite-max-uses"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={newInviteMaxUses}
                    onChange={(e) => setNewInviteMaxUses(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={createInviteLink} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Invite Link
              </Button>
            </div>

            {/* Existing Invites */}
            <div className="space-y-3">
              <h3 className="font-medium">Active Invite Links</h3>
              {inviteLinks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link className="h-8 w-8 mx-auto mb-2" />
                  <p>No invite links created yet</p>
                </div>
              ) : (
                <ScrollArea className="h-60">
                  <div className="space-y-3">
                    {inviteLinks.map((invite) => (
                      <div key={invite.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={invite.is_active ? "default" : "secondary"}>
                              {invite.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Uses: {invite.uses}/{invite.max_uses || '∞'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyInviteLink(invite.token)}
                              disabled={!invite.is_active}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {invite.is_active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deactivateInviteLink(invite.id)}
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Created: {new Date(invite.created_at).toLocaleDateString()}</p>
                          {invite.expires_at && (
                            <p>Expires: {new Date(invite.expires_at).toLocaleDateString()}</p>
                          )}
                          <div className="font-mono text-xs bg-muted p-2 rounded break-all">
                            {window.location.origin}/community?invite={invite.token}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityBoards;