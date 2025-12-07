import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;
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
} from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCloudinaryUpload, CloudinaryAttachment } from '@/hooks/useCloudinaryUpload';
import { MediaUploader } from '@/components/MediaUploader';
import { VideoPlayer } from '@/components/VideoPlayer';
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
  attachments?: Json;
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
  video_url?: string;
  video_thumbnail_url?: string;
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
  const [adMedia, setAdMedia] = useState<CloudinaryAttachment[]>([]);
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
  const { uploading, uploadMultipleFiles, progress, currentFileName, currentFileSize, uploadedBytes, uploadSpeed, currentFileIndex, totalFilesCount } = useCloudinaryUpload(user?.id || '', 'board-posts');

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
        } as any)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newBoard = data as any;
        // Add creator as admin member
        await supabase
          .from('board_members')
          .insert({
            board_id: newBoard.id,
            user_id: user.id,
            role: 'admin'
          } as any);

        setNewBoardName('');
        setNewBoardDescription('');
        setShowCreateBoard(false);
        fetchBoards();

        toast({
          title: "Group created!",
          description: `${newBoard.name} has been created successfully.`,
        });
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Simplified functions that bypass complex database operations
  const togglePinPost = async (post: BoardPost) => {
    console.log('Pin functionality temporarily disabled');
  };

  const addReaction = async (postId: string, reaction: string) => {
    console.log('Reaction functionality temporarily disabled');
  };

  const removeReaction = async (postId: string, reaction: string) => {
    console.log('Reaction removal temporarily disabled');
  };

  const fetchBoardMembers = async () => {
    console.log('Board members functionality temporarily disabled');
    setBoardMembers([]);
  };

  const updateBoardSettings = async (updates: Partial<DiscussionBoard>) => {
    console.log('Board settings update temporarily disabled');
  };

  const fetchInviteLinks = async () => {
    console.log('Invite links functionality temporarily disabled');
    setInviteLinks([]);
  };

  // Fetch groups
  const fetchBoards = async () => {
    if (!user) return;
    
    try {
      const { data: membershipData, error: membershipError } = await supabase
        .from('board_members')
        .select('board_id, role')
        .eq('user_id', user.id as any);

      if (membershipError) throw membershipError;

      if (!membershipData || membershipData.length === 0) {
        setBoards([]);
        return;
      }

      const boardIds = membershipData.map(m => 
        typeof m === 'object' && 'board_id' in m ? (m as any).board_id : null
      ).filter(Boolean);

      const { data: boardsData, error: boardsError } = await supabase
        .from('discussion_boards')
        .select('*')
        .in('id', boardIds)
        .order('updated_at', { ascending: false });

      if (boardsError) throw boardsError;

      const boardsWithCounts = await Promise.all(
        (boardsData || []).map(async (board: any) => {
          const { count } = await supabase
            .from('board_members')
            .select('*', { count: 'exact' })
            .eq('board_id', board.id);

          const userMembership = membershipData.find(m => 
            typeof m === 'object' && 'board_id' in m && (m as any).board_id === board.id
          );

          return {
            ...board,
            member_count: count || 0,
            user_role: userMembership && typeof userMembership === 'object' && 'role' in userMembership ? (userMembership as any).role : null
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
        description: "Failed to load groups.",
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
        .eq('is_public', true as any)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const boardsWithCounts = await Promise.all(
        (publicBoardsData || []).map(async (board: any) => {
          const { count } = await supabase
            .from('board_members')
            .select('*', { count: 'exact' })
            .eq('board_id', board.id);

          const { data: memberData } = await supabase
            .from('board_members')
            .select('role')
            .eq('board_id', board.id)
            .eq('user_id', user.id as any)
            .maybeSingle();

          return {
            ...board,
            member_count: count || 0,
            user_role: memberData && typeof memberData === 'object' && 'role' in memberData ? (memberData as any).role : null
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
        } as any);

      if (error) throw error;

      toast({
        title: "Joined group!",
        description: "You've successfully joined the group.",
      });

      fetchBoards();
      fetchPublicBoards();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error",
        description: "Failed to join group.",
        variant: "destructive",
      });
    }
  };

  // Fetch posts for selected board
  const fetchPosts = async () => {
    if (!selectedBoard) return;

    try {
      // Get user's creation date and board membership date for clean slate
      const { data: userData } = await supabase.auth.getUser();
      const userCreatedAt = userData.user?.created_at;

      // Check board membership for joined_at timestamp
      const { data: membership } = await supabase
        .from('board_memberships')
        .select('joined_at')
        .eq('board_id', selectedBoard)
        .eq('user_id', user?.id || '')
        .maybeSingle();

      // Use board join date if available, otherwise use user creation date
      const filterDate = membership?.joined_at || userCreatedAt;

      let query = supabase
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
        .eq('board_id', selectedBoard as any)
        .eq('approval_status', 'approved' as any)
        .order('created_at', { ascending: true });

      // Only show posts created after user joined board (clean slate)
      if (filterDate) {
        query = query.gte('created_at', filterDate as any);
      }

      const { data, error } = await query;

      if (error) throw error;

      const postsWithLikes = await Promise.all(
        (data || []).map(async (post: any) => {
          const { count } = await supabase
            .from('board_post_likes')
            .select('*', { count: 'exact' })
            .eq('post_id', post.id);

          const { data: userLike } = await supabase
            .from('board_post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user?.id as any)
            .maybeSingle();

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

  // Send message with media
  const sendMessage = async () => {
    if (!selectedBoard || (!newMessage.trim() && adMedia.length === 0) || !user || !profile) return;

    // Separate images and video
    const images = adMedia.filter(m => m.type === 'image');
    const video = adMedia.find(m => m.type === 'video');

    // Generate temporary post for optimistic UI
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempPost: BoardPost = {
      id: tempId,
      board_id: selectedBoard,
      user_id: user.id,
      content: newMessage.trim(),
      post_type: 'message',
      image_urls: images.map(img => img.url),
      video_url: video?.url,
      video_thumbnail_url: video?.thumbnailUrl,
      reply_to_id: null,
      is_pinned: false,
      approval_status: 'approved',
      approved_by: null,
      approved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tagged_members: taggedMembers,
      profiles: {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state,
      },
      likes_count: 0,
      is_liked_by_user: false,
      reactions: [],
    };

    // Add to UI immediately
    setPosts(prev => [...prev, tempPost]);
    
    // Clear input
    const messageContent = newMessage.trim();
    const imageUrls = images.map(img => img.url);
    const videoUrl = video?.url;
    const videoThumbnail = video?.thumbnailUrl;
    const members = [...taggedMembers];
    setNewMessage('');
    setAdMedia([]);
    setTaggedMembers([]);
    
    // Scroll
    setTimeout(() => scrollToBottom(), 50);

    // Backend operation
    try {
      const insertData: any = {
        board_id: selectedBoard,
        user_id: user.id,
        content: messageContent,
        post_type: 'message',
        tagged_members: members,
        image_urls: imageUrls,
        video_url: videoUrl,
        video_thumbnail_url: videoThumbnail
      };

      const { data, error } = await supabase
        .from('board_posts')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      // Replace temp post with real post
      if (data) {
        setPosts(prev => prev.map(p => 
          p.id === tempId ? { ...tempPost, id: data.id } : p
        ));
      }
    } catch (error) {
      // Remove temporary post on error
      setPosts(prev => prev.filter(p => p.id !== tempId));
      
      toast({
        title: "Failed to send",
        description: "Your message couldn't be sent. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleBoardPostLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Save previous state
    const previousPosts = [...posts];

    // Update UI immediately
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? {
            ...p,
            is_liked_by_user: !p.is_liked_by_user,
            likes_count: p.is_liked_by_user ? p.likes_count - 1 : p.likes_count + 1
          }
        : p
    ));

    // Backend operation
    try {
      if (post.is_liked_by_user) {
        // Unlike
        const { error } = await supabase
          .from('board_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('board_post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });
        
        if (error) throw error;
      }
    } catch (error) {
      // Rollback
      setPosts(previousPosts);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    fetchBoards();
    fetchPublicBoards();
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (selectedBoard) {
      fetchPosts();
      fetchBoardMembers();
    }
  }, [selectedBoard]);

  useEffect(() => {
    scrollToBottom();
  }, [posts]);

  // Auto-show conversation on mobile when board is selected
  useEffect(() => {
    if (isMobile && selectedBoard && !showMobileConversation) {
      setShowMobileConversation(true);
    }
  }, [isMobile, selectedBoard]);

  // Handle native back button on mobile devices
  useEffect(() => {
    const isNative = (window as any).Capacitor?.isNativePlatform?.() === true;
    if (!isNative || !isMobile) {
      return;
    }

    let listenerHandle: any = null;
    
    const setupListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        listenerHandle = await App.addListener('backButton', () => {
          if (showMobileConversation) {
            setShowMobileConversation(false);
          }
        });
      } catch (error) {
        console.error('Failed to setup back button listener:', error);
      }
    };
    
    setupListener();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [isMobile, showMobileConversation]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to access groups.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(162,85%,30%)]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Boards sidebar */}
      <div className={`${isMobile && showMobileConversation ? 'hidden' : 'flex'} w-80 border-r flex-col`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Groups</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDiscoverBoards(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateBoard(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {boards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                <p>No groups yet</p>
                <p className="text-sm">Join or create a group to get started</p>
              </div>
            ) : (
              boards.map((board) => (
                <div
                  key={board.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedBoard === board.id ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    setSelectedBoard(board.id);
                    if (isMobile) {
                      setShowMobileConversation(true);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={board.avatar_url} />
                      <AvatarFallback>
                        {board.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{board.name}</h3>
                        {board.is_public ? (
                          <Globe className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Shield className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{board.member_count}</span>
                        {board.user_role && (
                          <Badge variant="secondary" className="text-xs">
                            {board.user_role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Board content */}
      <div className={`${isMobile && !showMobileConversation ? 'hidden' : 'flex'} flex-1 flex-col`}>
        {selectedBoard ? (
          <>
            {/* Board header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileConversation(false)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div>
                  <h1 className="text-lg font-semibold">
                    {boards.find(b => b.id === selectedBoard)?.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {boards.find(b => b.id === selectedBoard)?.member_count} members
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMembersList(true)}
                >
                  <Users className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBoardSettings(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="flex gap-3">
                    <OnlineAvatar
                      userId={post.user_id}
                      src={post.profiles?.avatar_url}
                      fallback={post.profiles?.full_name?.charAt(0) || 'U'}
                      className="h-8 w-8"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {post.profiles?.full_name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleTimeString()}
                        </span>
                        {post.is_pinned && (
                          <Pin className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none">
                        {post.content}
                      </div>
                      {/* Video attachment */}
                      {post.video_url && (
                        <div className="mt-2 max-w-md">
                          <VideoPlayer
                            src={post.video_url}
                            poster={post.video_thumbnail_url}
                            controls={true}
                            autoPlay={false}
                            muted={false}
                          />
                        </div>
                      )}
                      {/* Image attachments */}
                      {post.image_urls && post.image_urls.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2 max-w-md">
                          {post.image_urls.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="rounded-lg max-h-48 object-cover"
                            />
                          ))}
                        </div>
                      )}
                      {/* Reactions */}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => toggleBoardPostLike(post.id)}
                        >
                          <ThumbsUp 
                            className={`h-3 w-3 mr-1 ${post.is_liked_by_user ? 'fill-current text-primary' : ''}`} 
                          />
                          {post.likes_count}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                        >
                          <Smile className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="p-4 border-t space-y-2">
              <MediaUploader
                onFilesSelected={async (files) => {
                  const attachments = await uploadMultipleFiles(files);
                  setAdMedia(prev => [...prev, ...attachments.filter((a): a is CloudinaryAttachment => a.type === 'image' || a.type === 'video')]);
                }}
                accept="both"
                maxFiles={5}
                uploadedFiles={adMedia}
                onRemove={(index) => {
                  setAdMedia(prev => prev.filter((_, i) => i !== index));
                }}
                uploading={uploading}
                progress={progress}
                currentFileName={currentFileName}
                currentFileSize={currentFileSize}
                uploadedBytes={uploadedBytes}
                uploadSpeed={uploadSpeed}
                currentFileIndex={currentFileIndex}
                totalFilesCount={totalFilesCount}
              />
              <div className="flex gap-2">
                <Textarea
                  ref={messageInputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="min-h-[40px] max-h-32 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={(!newMessage.trim() && adMedia.length === 0) || uploading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" />
              <p>Select a group to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Board Dialog */}
      <Dialog open={showCreateBoard} onOpenChange={setShowCreateBoard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="board-name">Group Name</Label>
              <Input
                id="board-name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            <div>
              <Label htmlFor="board-description">Description (optional)</Label>
              <Textarea
                id="board-description"
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="Describe what this group is about"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="board-public"
                checked={newBoardIsPublic}
                onCheckedChange={setNewBoardIsPublic}
              />
              <Label htmlFor="board-public">Make this group public</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateBoard(false)}>
                Cancel
              </Button>
              <Button onClick={createBoard} disabled={!newBoardName.trim()}>
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discover Groups Dialog */}
      <Dialog open={showDiscoverBoards} onOpenChange={setShowDiscoverBoards}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Discover Groups</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search groups..."
                className="flex-1"
              />
              <Button variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {publicBoards.map((board) => (
                  <div
                    key={board.id}
                    className="p-3 border rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={board.avatar_url} />
                        <AvatarFallback>
                          {board.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{board.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {board.member_count} members
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => joinBoard(board.id)}
                      disabled={board.user_role !== null}
                    >
                      {board.user_role ? 'Joined' : 'Join'}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityBoards;