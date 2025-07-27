import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Shield,
  Copy,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface DiscussionBoard {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  is_public: boolean;
  member_limit: number | null;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
  location: string | null;
  member_count: number;
  user_role: string | null;
}

interface BoardPost {
  id: string;
  board_id: string;
  user_id: string;
  content: string;
  post_type: string;
  image_urls: string[];
  reply_to_id: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  } | null;
  likes_count: number;
  is_liked_by_user: boolean;
}

const CommunityBoards = () => {
  const [boards, setBoards] = useState<DiscussionBoard[]>([]);
  const [publicBoards, setPublicBoards] = useState<DiscussionBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showDiscoverBoards, setShowDiscoverBoards] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newBoardIsPublic, setNewBoardIsPublic] = useState(true); // Default to public
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [currentInviteCode, setCurrentInviteCode] = useState<any>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  
  // Board editing states
  const [editingBoard, setEditingBoard] = useState(false);
  const [editBoardName, setEditBoardName] = useState('');
  const [editBoardDescription, setEditBoardDescription] = useState('');
  const [editBoardLocation, setEditBoardLocation] = useState('');
  const [savingBoardChanges, setSavingBoardChanges] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [posts]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Fetch users for @mentions
  const fetchUsers = async (query: string) => {
    if (!query.trim()) return [];
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, neighborhood, city')
        .ilike('full_name', `%${query}%`)
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  // Handle @mention input
  const handleMentionInput = async (text: string, cursorPos: number) => {
    const beforeCursor = text.substring(0, cursorPos);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setShowUserSuggestions(true);
      
      if (query.length > 0) {
        const users = await fetchUsers(query);
        setUserSuggestions(users);
      } else {
        // Show recent chatters when no query
        const recentUsers = posts
          .slice(-10)
          .map(p => p.profiles)
          .filter((profile, index, arr) => 
            profile && arr.findIndex(p => p?.full_name === profile.full_name) === index
          )
          .slice(0, 5);
        setUserSuggestions(recentUsers as any[]);
      }
    } else {
      setShowUserSuggestions(false);
      setUserSuggestions([]);
      setMentionQuery('');
    }
  };

  // Insert mention into text
  const insertMention = (user: any, isReply = false) => {
    const currentText = isReply ? replyText : newMessage;
    const textarea = textareaRef;
    
    if (!textarea) return;
    
    const cursorPos = textarea.selectionStart;
    const beforeCursor = currentText.substring(0, cursorPos);
    const afterCursor = currentText.substring(cursorPos);
    
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    if (!mentionMatch) return;
    
    const beforeMention = beforeCursor.substring(0, mentionMatch.index);
    const mention = `@${user.full_name} `;
    const newText = beforeMention + mention + afterCursor;
    
    if (isReply) {
      setReplyText(newText);
    } else {
      setNewMessage(newText);
    }
    
    setShowUserSuggestions(false);
    setUserSuggestions([]);
    setMentionQuery('');
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = beforeMention.length + mention.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Format message content with mentions
  const formatMessageContent = (content: string) => {
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        return (
          <span key={index} className="bg-primary/20 text-primary px-1 rounded font-medium">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  // Get the original message being replied to
  const getReplyMessage = (replyId: string) => {
    return posts.find(p => p.id === replyId);
  };

  // Fetch discussion boards
  const fetchBoards = async () => {
    if (!user) return;
    
    try {
      // First get boards where user is a member
      const { data: membershipData, error: membershipError } = await supabase
        .from('board_members')
        .select('board_id, role')
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      if (!membershipData || membershipData.length === 0) {
        setBoards([]);
        return;
      }

      // Get board IDs
      const boardIds = membershipData.map(m => m.board_id);

      // Get board details
      const { data: boardsData, error: boardsError } = await supabase
        .from('discussion_boards')
        .select('*')
        .in('id', boardIds)
        .order('updated_at', { ascending: false });

      if (boardsError) throw boardsError;

      // Get member counts for each board
      const boardsWithCounts = await Promise.all(
        (boardsData || []).map(async (board) => {
          const { count } = await supabase
            .from('board_members')
            .select('*', { count: 'exact' })
            .eq('board_id', board.id);

          // Find user's role in this board
          const userMembership = membershipData.find(m => m.board_id === board.id);

          return {
            ...board,
            member_count: count || 0,
            user_role: userMembership?.role || null
          };
        })
      );

      setBoards(boardsWithCounts as DiscussionBoard[]);
      
      // Select first board if none selected
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

  // Fetch public boards in user's location
  const fetchPublicBoards = async () => {
    console.log('fetchPublicBoards called', { userId: user?.id });
    if (!user?.id) return;

    try {
      // Get user's location
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('city, state, neighborhood')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // Get all board IDs user is already a member of or has created
      const { data: memberData } = await supabase
        .from('board_members')
        .select('board_id')
        .eq('user_id', user.id);

      const { data: creatorData } = await supabase
        .from('discussion_boards')
        .select('id')
        .eq('creator_id', user.id);

      const userBoardIds = [
        ...(memberData?.map(m => m.board_id) || []),
        ...(creatorData?.map(b => b.id) || [])
      ];

      // Fetch public boards in the same location
      let query = supabase
        .from('discussion_boards')
        .select(`
          *,
          creator:profiles!discussion_boards_creator_id_fkey(full_name, avatar_url)
        `)
        .eq('is_public', true);

      // Filter by location
      if (profileData.city) {
        query = query.or(`location.ilike.%${profileData.city}%,location.ilike.%${profileData.state}%`);
      } else if (profileData.state) {
        query = query.ilike('location', `%${profileData.state}%`);
      }

      // Exclude boards user is already in
      if (userBoardIds.length > 0) {
        query = query.not('id', 'in', `(${userBoardIds.join(',')})`);
      }

      const { data: publicBoardsData, error: publicBoardsError } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (publicBoardsError) throw publicBoardsError;

      // Transform data to match DiscussionBoard interface
      const transformedBoards = (publicBoardsData || []).map(board => ({
        ...board,
        member_count: 0, // Will be fetched separately if needed
        user_role: null
      }));

      setPublicBoards(transformedBoards as DiscussionBoard[]);
      console.log('Public boards loaded:', transformedBoards.length, transformedBoards);
    } catch (error) {
      console.error('Error fetching public boards:', error);
    }
  };

  // Request to join a board
  const requestToJoinBoard = async (boardId: string, message?: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('board_join_requests')
        .insert({
          board_id: boardId,
          user_id: user.id,
          message: message || null
        });

      if (error) throw error;

      toast({
        title: "Request sent",
        description: "Your join request has been sent to the board admins.",
      });

      // Refresh public boards to update request status
      fetchPublicBoards();
    } catch (error) {
      console.error('Error requesting to join board:', error);
      toast({
        title: "Error",
        description: "Failed to send join request.",
        variant: "destructive",
      });
    }
  };

  // Handle join request (approve/reject)
  const handleJoinRequest = async (requestId: string, action: 'approved' | 'rejected') => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('board_join_requests')
        .update({
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Refresh join requests and board members
      fetchBoardMembers();

      toast({
        title: action === 'approved' ? "Request approved" : "Request rejected",
        description: action === 'approved' 
          ? "User has been added to the board." 
          : "Join request has been rejected.",
      });
    } catch (error) {
      console.error('Error handling join request:', error);
      toast({
        title: "Error",
        description: "Failed to process join request.",
        variant: "destructive",
      });
    }
  };

  // Fetch posts for selected board
  const fetchPosts = async () => {
    if (!selectedBoard || !user) return;
    
    setLoading(true);
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('board_posts')
        .select('*')
        .eq('board_id', selectedBoard)
        .order('created_at', { ascending: true });

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Get user IDs and fetch profiles
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, neighborhood, city, state')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Get likes
      const postIds = postsData.map(post => post.id);
      const { data: likesData, error: likesError } = await supabase
        .from('board_post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds);

      if (likesError) {
        console.error('Error fetching likes:', likesError);
      }

      // Create profiles map
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.user_id, profile])
      );

      // Process posts
      const processedPosts = postsData.map(post => ({
        ...post,
        profiles: profilesMap.get(post.user_id) || null,
        likes_count: likesData?.filter(like => like.post_id === post.id).length || 0,
        is_liked_by_user: likesData?.some(like => like.post_id === post.id && like.user_id === user.id) || false
      }));

      setPosts(processedPosts as BoardPost[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new board
  const createBoard = async () => {
    console.log('createBoard called', { newBoardName, user: user?.id });
    
    if (!newBoardName.trim() || !user) {
      console.log('Validation failed:', { boardName: newBoardName.trim(), userId: user?.id });
      return;
    }

    try {
      console.log('Creating board with data:', {
        name: newBoardName.trim(),
        description: newBoardDescription.trim() || null,
        creator_id: user.id,
        is_public: newBoardIsPublic,
        location: profile?.neighborhood || profile?.city || null
      });

      // Create board
      const { data: boardData, error: boardError } = await supabase
        .from('discussion_boards')
        .insert({
          name: newBoardName.trim(),
          description: newBoardDescription.trim() || null,
          creator_id: user.id,
          is_public: newBoardIsPublic,
          location: profile?.neighborhood || profile?.city || null
        })
        .select()
        .single();

      if (boardError) {
        console.error('Board creation error:', boardError);
        throw boardError;
      }

      console.log('Board created successfully:', boardData);

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('board_members')
        .insert({
          board_id: boardData.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) {
        console.error('Member creation error:', memberError);
        throw memberError;
      }

      console.log('Member added successfully');

      setNewBoardName('');
      setNewBoardDescription('');
      setNewBoardIsPublic(true); // Reset to default
      setShowCreateBoard(false);
      fetchBoards();
      
      toast({
        title: "Board created",
        description: "Your discussion board has been created successfully.",
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

  // Send message/post
  const sendPost = async (isReply = false) => {
    const content = isReply ? replyText : newMessage;
    if (!content.trim() || !user || !selectedBoard) return;

    // Create optimistic post
    const optimisticPost: BoardPost = {
      id: `temp-${Date.now()}`,
      board_id: selectedBoard,
      user_id: user.id,
      content: content.trim(),
      post_type: 'message',
      image_urls: [],
      reply_to_id: isReply ? replyingTo : null,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        full_name: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        neighborhood: profile?.neighborhood || null,
        city: profile?.city || null,
        state: profile?.state || null,
      },
      likes_count: 0,
      is_liked_by_user: false
    };

    // Add optimistic post
    setPosts(prev => [...prev, optimisticPost]);

    // Clear input
    if (isReply) {
      setReplyText('');
      setReplyingTo(null);
    } else {
      setNewMessage('');
    }

    try {
      const { data, error } = await supabase
        .from('board_posts')
        .insert({
          board_id: selectedBoard,
          user_id: user.id,
          content: content.trim(),
          post_type: 'message',
          reply_to_id: isReply ? replyingTo : null
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic post with real one
      setPosts(prev => prev.map(p => 
        p.id === optimisticPost.id 
          ? { ...optimisticPost, id: data.id, created_at: data.created_at, updated_at: data.updated_at }
          : p
      ));
    } catch (error) {
      console.error('Error sending post:', error);
      
      // Remove optimistic post on error
      setPosts(prev => prev.filter(p => p.id !== optimisticPost.id));
      
      // Restore input
      if (isReply) {
        setReplyText(content);
        setReplyingTo(replyingTo);
      } else {
        setNewMessage(content);
      }
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Toggle like
  const toggleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.is_liked_by_user) {
        const { error } = await supabase
          .from('board_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, is_liked_by_user: false, likes_count: p.likes_count - 1 }
            : p
        ));
      } else {
        const { error } = await supabase
          .from('board_post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;

        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, is_liked_by_user: true, likes_count: p.likes_count + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Toggle pin (only for admins/moderators)
  const togglePin = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    const currentBoard = boards.find(b => b.id === selectedBoard);
    
    if (!post || !currentBoard || 
        (currentBoard.user_role !== 'admin' && currentBoard.user_role !== 'moderator' && post.user_id !== user.id)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('board_posts')
        .update({ is_pinned: !post.is_pinned })
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, is_pinned: !p.is_pinned }
          : p
      ));

      toast({
        title: post.is_pinned ? "Message unpinned" : "Message pinned",
        description: post.is_pinned ? "Message has been unpinned." : "Message has been pinned.",
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "Error",
        description: "Failed to pin/unpin message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (userId: string) => {
    const currentBoard = boards.find(b => b.id === selectedBoard);
    if (!currentBoard) return null;
    
    if (currentBoard.creator_id === userId) {
      return <Crown className="h-3 w-3 text-yellow-500" />;
    }
    
    if (currentBoard.user_role === 'admin') {
      return <Shield className="h-3 w-3 text-blue-500" />;
    }
    
    return null;
  };

  const getRoleBadge = (userId: string) => {
    const currentBoard = boards.find(b => b.id === selectedBoard);
    if (!currentBoard) return null;
    
    if (currentBoard.creator_id === userId) {
      return <Badge variant="default" className="text-xs">Creator</Badge>;
    }
    
    if (currentBoard.user_role === 'admin') {
      return <Badge variant="secondary" className="text-xs">Admin</Badge>;
    }
    
    return null;
  };

  // Generate invite link for the board
  const generateInviteLink = async () => {
    if (!selectedBoard || !user) return;
    
    setGeneratingLink(true);
    try {
      // Check for existing active invite code
      const { data: existingCode, error: fetchError } = await supabase
        .from('board_invite_codes')
        .select('*')
        .eq('board_id', selectedBoard)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let inviteCode = existingCode;

      // If no active code exists, create a new one
      if (!inviteCode) {
        const { data: newCode, error: createError } = await supabase
          .rpc('generate_board_invite_code')
          .single();

        if (createError) throw createError;

        const { data: insertedCode, error: insertError } = await supabase
          .from('board_invite_codes')
          .insert({
            board_id: selectedBoard,
            code: newCode,
            created_by: user.id
          })
          .select()
          .single();

        if (insertError) throw insertError;
        inviteCode = insertedCode;
      }

      const baseUrl = window.location.origin;
      const link = `${baseUrl}/community?invite=${inviteCode.code}`;
      setInviteLink(link);
      setCurrentInviteCode(inviteCode);
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast({
        title: "Error",
        description: "Failed to generate invite link.",
        variant: "destructive",
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  // Revoke current invite link
  const revokeInviteLink = async () => {
    if (!currentInviteCode || !user) return;

    try {
      const { error } = await supabase
        .from('board_invite_codes')
        .update({ is_active: false })
        .eq('id', currentInviteCode.id);

      if (error) throw error;

      setInviteLink('');
      setCurrentInviteCode(null);
      
      toast({
        title: "Link revoked",
        description: "The invite link has been deactivated.",
      });
    } catch (error) {
      console.error('Error revoking invite link:', error);
      toast({
        title: "Error",
        description: "Failed to revoke invite link.",
        variant: "destructive",
      });
    }
  };

  // Copy invite link to clipboard
  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      toast({
        title: "Link copied",
        description: "Invite link has been copied to clipboard.",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Generate new invite link (revokes old one and creates new)
  const generateNewInviteLink = async () => {
    if (!selectedBoard || !user) return;

    setGeneratingLink(true);
    try {
      // First revoke all existing active codes
      await supabase
        .from('board_invite_codes')
        .update({ is_active: false })
        .eq('board_id', selectedBoard)
        .eq('is_active', true);

      // Generate new code
      const { data: newCode, error: createError } = await supabase
        .rpc('generate_board_invite_code')
        .single();

      if (createError) throw createError;

      const { data: insertedCode, error: insertError } = await supabase
        .from('board_invite_codes')
        .insert({
          board_id: selectedBoard,
          code: newCode,
          created_by: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const baseUrl = window.location.origin;
      const link = `${baseUrl}/community?invite=${insertedCode.code}`;
      setInviteLink(link);
      setCurrentInviteCode(insertedCode);
      
      toast({
        title: "New link generated",
        description: "A new invite link has been created.",
      });
    } catch (error) {
      console.error('Error generating new invite link:', error);
      toast({
        title: "Error",
        description: "Failed to generate new invite link.",
        variant: "destructive",
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  // Update board privacy setting
  const updateBoardPrivacy = async (isPublic: boolean) => {
    if (!selectedBoard || !currentBoard || !user) return;

    // Check if user has permission
    if (currentBoard.user_role !== 'admin' && currentBoard.creator_id !== user.id) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to change board settings.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('discussion_boards')
        .update({ is_public: isPublic })
        .eq('id', selectedBoard);

      if (error) throw error;

      // Update local state
      setBoards(prev => 
        prev.map(board => 
          board.id === selectedBoard 
            ? { ...board, is_public: isPublic }
            : board
        )
      );

      toast({
        title: "Settings updated",
        description: `Board is now ${isPublic ? 'public' : 'private'}.`,
      });
    } catch (error) {
      console.error('Error updating board privacy:', error);
      toast({
        title: "Error",
        description: "Failed to update board settings.",
        variant: "destructive",
      });
    }
  };

  // Start editing board details
  const startEditingBoard = () => {
    if (!currentBoard) return;
    setEditBoardName(currentBoard.name);
    setEditBoardDescription(currentBoard.description || '');
    setEditBoardLocation(currentBoard.location || '');
    setEditingBoard(true);
  };

  // Cancel editing board details
  const cancelEditingBoard = () => {
    setEditingBoard(false);
    setEditBoardName('');
    setEditBoardDescription('');
    setEditBoardLocation('');
  };

  // Save board details
  const saveBoardDetails = async () => {
    if (!selectedBoard || !currentBoard || !user) return;

    // Check if user has permission
    if (currentBoard.user_role !== 'admin' && currentBoard.creator_id !== user.id) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to edit board details.",
        variant: "destructive",
      });
      return;
    }

    // Validate input
    if (!editBoardName.trim()) {
      toast({
        title: "Validation error",
        description: "Board name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setSavingBoardChanges(true);

    try {
      const { error } = await supabase
        .from('discussion_boards')
        .update({
          name: editBoardName.trim(),
          description: editBoardDescription.trim() || null,
          location: editBoardLocation.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBoard);

      if (error) throw error;

      // Update local state
      setBoards(prev => 
        prev.map(board => 
          board.id === selectedBoard 
            ? { 
                ...board, 
                name: editBoardName.trim(),
                description: editBoardDescription.trim() || null,
                location: editBoardLocation.trim() || null,
                updated_at: new Date().toISOString()
              }
            : board
        )
      );

      setEditingBoard(false);
      toast({
        title: "Board updated",
        description: "Board details have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating board details:', error);
      toast({
        title: "Error",
        description: "Failed to update board details.",
        variant: "destructive",
      });
    } finally {
      setSavingBoardChanges(false);
    }
  };

  // Fetch board members and join requests
  const fetchBoardMembers = async () => {
    if (!selectedBoard) return;

    try {
      // First get board members from board_members table
      const { data: membersData, error: membersError } = await supabase
        .from('board_members')
        .select('user_id, role, joined_at')
        .eq('board_id', selectedBoard)
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      // Get board creator info
      const { data: boardData, error: boardError } = await supabase
        .from('discussion_boards')
        .select('creator_id, created_at')
        .eq('id', selectedBoard)
        .single();

      if (boardError) {
        console.error('Error fetching board info:', boardError);
      }

      // Get pending join requests (only for admins/creators)
      const { data: requestsData, error: requestsError } = await supabase
        .from('board_join_requests')
        .select(`
          *,
          profiles!board_join_requests_user_id_fkey(full_name, avatar_url, city, state, neighborhood)
        `)
        .eq('board_id', selectedBoard)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching join requests:', requestsError);
      } else {
        setJoinRequests(requestsData || []);
      }

      // Collect all unique user IDs (board members + creator)
      const memberUserIds = membersData?.map(member => member.user_id) || [];
      const allUserIds = new Set(memberUserIds);
      
      // Add creator if not already in members list
      if (boardData?.creator_id) {
        allUserIds.add(boardData.creator_id);
      }

      if (allUserIds.size === 0) {
        setBoardMembers([]);
        return;
      }

      // Get user profiles for all unique users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, neighborhood, city, state')
        .in('user_id', Array.from(allUserIds));

      if (profilesError) {
        console.error('Error fetching member profiles:', profilesError);
      }

      // Create profiles map for easy lookup
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.user_id, profile])
      );

      // Build complete members list
      const allMembers = [];

      // Add board creator first (if not already in members table)
      if (boardData?.creator_id) {
        const creatorInMembers = membersData?.find(m => m.user_id === boardData.creator_id);
        if (!creatorInMembers) {
          allMembers.push({
            user_id: boardData.creator_id,
            role: 'creator',
            joined_at: boardData.created_at,
            profiles: profilesMap.get(boardData.creator_id) || null
          });
        }
      }

      // Add all other board members
      if (membersData) {
        const membersWithProfiles = membersData.map(member => ({
          ...member,
          // If this member is the creator, mark them as creator role
          role: member.user_id === boardData?.creator_id ? 'creator' : member.role,
          profiles: profilesMap.get(member.user_id) || null
        }));
        allMembers.push(...membersWithProfiles);
      }

      // Sort by join date (creator first, then by joined_at)
      allMembers.sort((a, b) => {
        if (a.role === 'creator' && b.role !== 'creator') return -1;
        if (b.role === 'creator' && a.role !== 'creator') return 1;
        return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
      });

      setBoardMembers(allMembers);
      generateInviteLink();
    } catch (error) {
      console.error('Error fetching board members:', error);
      toast({
        title: "Error",
        description: "Failed to load board members.",
        variant: "destructive",
      });
    }
  };

  // Update member role
  const updateMemberRole = async (userId: string, newRole: string) => {
    if (!selectedBoard || !currentBoard) return;

    // Check if user has permission
    if (currentBoard.user_role !== 'admin' && currentBoard.creator_id !== user?.id) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to change member roles.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('board_members')
        .update({ role: newRole })
        .eq('board_id', selectedBoard)
        .eq('user_id', userId);

      if (error) throw error;

      setBoardMembers(prev => 
        prev.map(member => 
          member.user_id === userId 
            ? { ...member, role: newRole }
            : member
        )
      );

      toast({
        title: "Role updated",
        description: "Member role has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role.",
        variant: "destructive",
      });
    }
  };

  // Remove member
  const removeMember = async (userId: string) => {
    if (!selectedBoard || !currentBoard) return;

    // Check if user has permission
    if (currentBoard.user_role !== 'admin' && currentBoard.creator_id !== user?.id) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to remove members.",
        variant: "destructive",
      });
      return;
    }

    // Don't allow removing the creator
    if (currentBoard.creator_id === userId) {
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
        .eq('board_id', selectedBoard)
        .eq('user_id', userId);

      if (error) throw error;

      setBoardMembers(prev => prev.filter(member => member.user_id !== userId));
      fetchBoards(); // Refresh board list to update member count

      toast({
        title: "Member removed",
        description: "Member has been removed from the board.",
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchBoards();
      fetchPublicBoards();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBoard) {
      fetchPosts();
      fetchBoardMembers();
    }
  }, [selectedBoard, user]);

  // Set up real-time subscription for posts
  useEffect(() => {
    if (!selectedBoard || !user) return;

    const channel = supabase
      .channel(`board_posts_${selectedBoard}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_posts',
          filter: `board_id=eq.${selectedBoard}`
        },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_post_likes'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBoard, user]);

  const currentBoard = boards.find(b => b.id === selectedBoard);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-12rem)] bg-background overflow-hidden">
      {/* Boards Sidebar */}
      <div className="w-full md:w-80 border-b md:border-r md:border-b-0 bg-card flex-shrink-0">
        <div className="p-3 md:p-4 border-b">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold">Discussion Boards</h2>
            <div className="flex gap-1 md:gap-2">
              <Dialog open={showDiscoverBoards} onOpenChange={setShowDiscoverBoards}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      console.log('Discover button clicked');
                      fetchPublicBoards();
                    }}
                    className="text-xs md:text-sm px-2 md:px-3"
                  >
                    <Globe className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                    <span className="hidden md:inline">Discover</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Discover Public Boards</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {publicBoards.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">No public boards found in your area</p>
                        </div>
                      ) : (
                        publicBoards.map((board) => (
                          <Card key={board.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Hash className="h-4 w-4 text-muted-foreground" />
                                  <h3 className="font-medium">{board.name}</h3>
                                  <Badge variant="outline" className="text-xs">Public</Badge>
                                </div>
                                {board.description && (
                                  <p className="text-sm text-muted-foreground mb-2">{board.description}</p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <div className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {board.location || 'Global'}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Created {new Date(board.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => requestToJoinBoard(board.id)}
                                className="ml-4"
                              >
                                Request to Join
                              </Button>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
               </Dialog>
               <Dialog open={showCreateBoard} onOpenChange={setShowCreateBoard}>
                <DialogTrigger asChild>
                  <Button 
                    variant="default" 
                    size="sm"
                    className="text-xs md:text-sm px-2 md:px-3"
                  >
                    <Plus className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                    <span className="hidden md:inline">Create</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Board</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="board-name">Board Name</Label>
                      <Input
                        id="board-name"
                        placeholder="Enter board name..."
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
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
                      <Label htmlFor="board-public">Make this board public</Label>
                    </div>
                    <Button onClick={createBoard} className="w-full">
                      Create Board
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search boards..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-140px)] md:h-[calc(100%-120px)]">
          {boards
            .filter(board => board.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((board) => (
            <div
              key={board.id}
              onClick={() => setSelectedBoard(board.id)}
              className={`p-3 md:p-4 cursor-pointer transition-colors border-b hover:bg-muted/50 ${
                selectedBoard === board.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm">{board.name}</h3>
                  {board.user_role === 'admin' && <Crown className="h-3 w-3 text-yellow-500" />}
                  {board.creator_id === user?.id && <Badge variant="outline" className="text-xs">Owner</Badge>}
                </div>
              </div>
              
              {board.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{board.description}</p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {board.member_count} members
                </div>
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {board.location || 'Global'}
                </div>
              </div>
              
              <div className="flex items-center mt-2 space-x-2">
                {board.is_public ? (
                  <Badge variant="outline" className="text-xs">Public</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Private</Badge>
                )}
                <Badge variant="outline" className="text-xs">{board.user_role}</Badge>
              </div>
            </div>
          ))}
        </ScrollArea>
        
        <div className="p-4 border-t">
          <Dialog open={showCreateBoard} onOpenChange={setShowCreateBoard}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => console.log('Create Board button clicked')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Discussion Board</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Board Name</label>
                  <Input
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="Enter board name..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    placeholder="Describe what this board is for..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Public Board</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow anyone to discover and join this board
                    </p>
                  </div>
                  <Switch
                    checked={newBoardIsPublic}
                    onCheckedChange={setNewBoardIsPublic}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setShowCreateBoard(false);
                    setNewBoardName('');
                    setNewBoardDescription('');
                    setNewBoardIsPublic(true);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={createBoard} disabled={!newBoardName.trim()}>
                    Create Board
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedBoard ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">{currentBoard?.name}</h2>
                    {currentBoard?.creator_id === user?.id && <Crown className="h-4 w-4 text-yellow-500" />}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {currentBoard?.member_count || 0} members
                    {currentBoard?.location && (
                      <>
                        <MapPin className="h-4 w-4 ml-3 mr-1" />
                        {currentBoard.location}
                      </>
                    )}
                  </div>
                  {currentBoard?.description && (
                    <p className="text-sm text-muted-foreground mt-1">{currentBoard.description}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Pin className="h-4 w-4 mr-1" />
                    Pinned
                  </Button>
                  <Dialog open={showMembers} onOpenChange={setShowMembers}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-1" />
                        Members
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Board Members</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-96">
                        {boardMembers.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">No members found</p>
                            <Button onClick={fetchBoardMembers} variant="outline" size="sm">
                              Retry Loading
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* All members list */}
                            {boardMembers.map((member) => {
                              const isCreator = member.role === 'creator' || member.user_id === currentBoard?.creator_id;
                              const isAdmin = member.role === 'admin';
                              const isModerator = member.role === 'moderator';
                              
                              return (
                                <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={member.profiles?.avatar_url || undefined} />
                                      <AvatarFallback>
                                        {member.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <p className="font-medium text-sm">{member.profiles?.full_name || 'Anonymous User'}</p>
                                        {isCreator && <Crown className="h-3 w-3 text-yellow-500" />}
                                        {(isAdmin && !isCreator) && <Shield className="h-3 w-3 text-blue-500" />}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {[member.profiles?.neighborhood, member.profiles?.city, member.profiles?.state]
                                          .filter(Boolean).join(', ') || 'Unknown Location'}
                                      </p>
                                      <div className="flex items-center space-x-2 mt-1">
                                        {isCreator ? (
                                          <Badge variant="default" className="text-xs">Creator</Badge>
                                        ) : isAdmin ? (
                                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                                        ) : isModerator ? (
                                          <Badge variant="outline" className="text-xs">Moderator</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-xs">Member</Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                          {isCreator ? 'Created' : 'Joined'} {new Date(member.joined_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Member actions */}
                                  {(currentBoard?.creator_id === user?.id || currentBoard?.user_role === 'admin') && member.user_id !== user?.id && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        {!isCreator && currentBoard?.creator_id === user?.id && (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="w-full justify-start text-xs"
                                              onClick={() => {/* TODO: Promote to admin */}}
                                            >
                                              {isAdmin ? 'Remove Admin' : 'Make Admin'}
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="w-full justify-start text-xs text-destructive"
                                              onClick={() => {/* TODO: Remove member */}}
                                            >
                                              Remove Member
                                            </Button>
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              );
                            })}
                            
                            {/* Add new member section */}
                            {(currentBoard?.creator_id === user?.id || currentBoard?.user_role === 'admin') && (
                              <div className="space-y-3 pt-4 border-t">
                                <DropdownMenu open={showAddMember} onOpenChange={setShowAddMember}>
                                  <DropdownMenuTrigger asChild>
                                    <Button className="w-full">
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add New Member
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-80">
                                    <div className="p-3 space-y-3">
                                      <div>
                                        <Label className="text-sm font-medium">Share Invite Link</Label>
                                        <p className="text-xs text-muted-foreground mb-2">
                                          Anyone with this link can join your board
                                        </p>
                                      </div>
                                      
                                      {!inviteLink ? (
                                        <Button 
                                          onClick={generateInviteLink}
                                          disabled={generatingLink}
                                          className="w-full"
                                          size="sm"
                                        >
                                          {generatingLink ? "Generating..." : "Generate Invite Link"}
                                        </Button>
                                      ) : (
                                        <div className="space-y-2">
                                          <div className="flex space-x-2">
                                            <Input
                                              value={inviteLink}
                                              readOnly
                                              className="text-xs"
                                              placeholder="Generating link..."
                                            />
                                            <Button
                                              size="sm"
                                              onClick={copyInviteLink}
                                              className="px-3"
                                            >
                                              {linkCopied ? (
                                                <>
                                                  <span className="text-xs mr-1">✓</span>
                                                  Copied
                                                </>
                                              ) : (
                                                <>
                                                  <Copy className="h-3 w-3 mr-1" />
                                                  Copy
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                          
                                          <div className="flex space-x-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={generateNewInviteLink}
                                              disabled={generatingLink}
                                              className="flex-1"
                                            >
                                              <RefreshCw className="h-3 w-3 mr-1" />
                                              {generatingLink ? "Generating..." : "Generate New"}
                                            </Button>
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              onClick={revokeInviteLink}
                                              className="flex-1"
                                            >
                                              <Trash2 className="h-3 w-3 mr-1" />
                                              Revoke Link
                                            </Button>
                                          </div>
                                          
                                          {currentInviteCode && (
                                            <p className="text-xs text-muted-foreground">
                                              Expires: {new Date(currentInviteCode.expires_at).toLocaleDateString()}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        )}
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  {(currentBoard?.user_role === 'admin' || currentBoard?.creator_id === user?.id) && (
                    <Dialog open={showSettings} onOpenChange={setShowSettings}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Settings
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Board Settings</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-96">
                          <div className="space-y-6">
                            {/* Basic Settings */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-sm">Basic Information</h3>
                                {(currentBoard?.user_role === 'admin' || currentBoard?.creator_id === user?.id) && (
                                  <div className="flex space-x-2">
                                    {editingBoard ? (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={cancelEditingBoard}
                                          disabled={savingBoardChanges}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={saveBoardDetails}
                                          disabled={savingBoardChanges}
                                        >
                                          {savingBoardChanges ? "Saving..." : "Save"}
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={startEditingBoard}
                                      >
                                        Edit
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="grid gap-4">
                                <div>
                                  <label className="text-sm font-medium">Board Name</label>
                                  {editingBoard ? (
                                    <Input 
                                      value={editBoardName}
                                      onChange={(e) => setEditBoardName(e.target.value)}
                                      placeholder="Enter board name..."
                                      disabled={savingBoardChanges}
                                    />
                                  ) : (
                                    <Input value={currentBoard?.name || ''} readOnly className="bg-muted" />
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Description</label>
                                  {editingBoard ? (
                                    <Textarea 
                                      value={editBoardDescription}
                                      onChange={(e) => setEditBoardDescription(e.target.value)}
                                      placeholder="Describe what this board is for..."
                                      className="resize-none" 
                                      rows={3}
                                      disabled={savingBoardChanges}
                                    />
                                  ) : (
                                    <Textarea 
                                      value={currentBoard?.description || ''} 
                                      readOnly 
                                      className="bg-muted resize-none" 
                                      rows={3}
                                    />
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Location</label>
                                  {editingBoard ? (
                                    <Input 
                                      value={editBoardLocation}
                                      onChange={(e) => setEditBoardLocation(e.target.value)}
                                      placeholder="Enter location (optional)"
                                      disabled={savingBoardChanges}
                                    />
                                  ) : (
                                    <Input value={currentBoard?.location || 'Global'} readOnly className="bg-muted" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Privacy Settings */}
                            <div className="space-y-4">
                              <h3 className="font-medium text-sm">Privacy & Access</h3>
                              <div className="grid gap-4">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Public Board</p>
                                    <p className="text-xs text-muted-foreground">
                                      {currentBoard?.is_public 
                                        ? "Anyone can discover and join this board" 
                                        : "Only invited users can join this board"}
                                    </p>
                                  </div>
                                  <Switch
                                    checked={currentBoard?.is_public || false}
                                    onCheckedChange={updateBoardPrivacy}
                                    disabled={currentBoard?.user_role !== 'admin' && currentBoard?.creator_id !== user?.id}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium">Member Limit</p>
                                    <p className="text-xs text-muted-foreground">
                                      Current: {currentBoard?.member_count || 0} members
                                    </p>
                                  </div>
                                  <Badge variant="outline">
                                    {currentBoard?.member_limit || 'Unlimited'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Board Statistics */}
                            <div className="space-y-4">
                              <h3 className="font-medium text-sm">Statistics</h3>
                              <div className="grid gap-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Total Messages</span>
                                  <Badge variant="outline">{posts.length}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span>Total Members</span>
                                  <Badge variant="outline">{currentBoard?.member_count || 0}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span>Created</span>
                                  <span className="text-xs text-muted-foreground">
                                    {currentBoard?.created_at ? new Date(currentBoard.created_at).toLocaleDateString() : 'Unknown'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Danger Zone */}
                            {currentBoard?.creator_id === user?.id && (
                              <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-medium text-sm text-destructive">Danger Zone</h3>
                                <div className="p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-destructive">Delete Board</p>
                                      <p className="text-xs text-muted-foreground">
                                        This action cannot be undone
                                      </p>
                                    </div>
                                    <Button variant="destructive" size="sm">
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading messages...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Hash className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No messages in {currentBoard?.name} yet.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Be the first to start a conversation!
                      </p>
                    </div>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className={`relative ${post.is_pinned ? 'bg-primary/5 rounded-lg p-3 border border-primary/20' : ''}`}>
                      {post.is_pinned && (
                        <div className="flex items-center text-xs text-primary mb-2">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned message
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={post.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {post.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{post.profiles?.full_name || 'Anonymous User'}</span>
                            {getRoleIcon(post.user_id)}
                            {getRoleBadge(post.user_id)}
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {post.profiles?.neighborhood || post.profiles?.city || 'Unknown Location'}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimeAgo(post.created_at)}
                            </div>
                          </div>
                          
                          {/* Show reply preview if this is a reply */}
                          {post.reply_to_id && (
                            <div className="mb-2 p-2 bg-muted/20 border-l-2 border-primary/30 rounded-r">
                              <div className="text-xs text-muted-foreground mb-1">
                                <Reply className="h-3 w-3 inline mr-1" />
                                Replying to {getReplyMessage(post.reply_to_id)?.profiles?.full_name || 'Unknown User'}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {getReplyMessage(post.reply_to_id)?.content || 'Message not found'}
                              </p>
                            </div>
                          )}
                          
                          <div className="text-sm mb-3 leading-relaxed break-words">
                            {formatMessageContent(post.content)}
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLike(post.id)}
                              className={`h-7 px-2 ${post.is_liked_by_user ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`}
                            >
                              <Heart className={`h-3 w-3 mr-1 ${post.is_liked_by_user ? 'fill-current' : ''}`} />
                              {post.likes_count > 0 && post.likes_count}
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                              className="h-7 px-2 text-muted-foreground hover:text-primary"
                            >
                              <Reply className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                            
                            {(currentBoard?.user_role === 'admin' || 
                              currentBoard?.user_role === 'moderator' || 
                              post.user_id === user?.id) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => togglePin(post.id)}
                                className="h-7 px-2 text-muted-foreground hover:text-primary"
                              >
                                <Pin className="h-3 w-3" />
                              </Button>
                            )}
                            
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Reply input */}
                          {replyingTo === post.id && (
                            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-2">
                                Replying to {post.profiles?.full_name || 'Anonymous User'}
                              </p>
                              <div className="flex space-x-2">
                                <Textarea
                                  ref={setTextareaRef}
                                  placeholder="Type your reply..."
                                  value={replyText}
                                  onChange={(e) => {
                                    setReplyText(e.target.value);
                                    handleMentionInput(e.target.value, e.target.selectionStart);
                                  }}
                                  className="min-h-[60px] resize-none"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      sendPost(true);
                                    }
                                  }}
                                />
                                <div className="flex flex-col space-y-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => sendPost(true)}
                                    disabled={!replyText.trim()}
                                    className="px-3"
                                  >
                                    <Send className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost"
                                    size="sm" 
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText('');
                                    }}
                                    className="px-3"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* User suggestions for mentions */}
                              {showUserSuggestions && userSuggestions.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                  {userSuggestions.map((suggestedUser, index) => (
                                    <div
                                      key={index}
                                      onClick={() => insertMention(suggestedUser, true)}
                                      className="p-2 hover:bg-muted cursor-pointer flex items-center space-x-2"
                                    >
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={suggestedUser.avatar_url || undefined} />
                                        <AvatarFallback className="text-xs">
                                          {suggestedUser.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-sm font-medium">{suggestedUser.full_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {suggestedUser.neighborhood || suggestedUser.city || 'Unknown Location'}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
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

            {/* Message Input */}
            <div className="p-3 md:p-4 border-t bg-card">
              <div className="flex gap-2 md:gap-3">
                <Avatar className="h-6 w-6 md:h-8 md:w-8 shrink-0">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2 relative">
                  {/* Reply preview when replying */}
                  {replyingTo && (
                    <div className="p-2 bg-muted/20 border-l-2 border-primary/30 rounded-r mb-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          <Reply className="h-3 w-3 inline mr-1" />
                          Replying to {getReplyMessage(replyingTo)?.profiles?.full_name || 'Unknown User'}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="h-5 w-5 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {getReplyMessage(replyingTo)?.content || 'Message not found'}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Textarea
                      ref={setTextareaRef}
                      placeholder={`Message ${currentBoard?.name}...`}
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleMentionInput(e.target.value, e.target.selectionStart);
                      }}
                      className="min-h-[50px] md:min-h-[60px] resize-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendPost();
                        }
                      }}
                    />
                    <Button
                      onClick={() => sendPost()}
                      disabled={!newMessage.trim()}
                      className="px-3 md:px-4 h-12 md:h-auto"
                    >
                      <Send className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                  
                  {/* User suggestions for mentions */}
                  {showUserSuggestions && userSuggestions.length > 0 && (
                    <div className="absolute z-10 bottom-full mb-2 w-full bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {userSuggestions.map((suggestedUser, index) => (
                        <div
                          key={index}
                          onClick={() => insertMention(suggestedUser)}
                          className="p-2 hover:bg-muted cursor-pointer flex items-center space-x-2"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={suggestedUser.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {suggestedUser.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{suggestedUser.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {suggestedUser.neighborhood || suggestedUser.city || 'Unknown Location'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Hash className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Discussion Board</h3>
              <p className="text-muted-foreground mb-4">Choose a board from the sidebar to start chatting</p>
              <Button onClick={() => setShowCreateBoard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Board
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityBoards;