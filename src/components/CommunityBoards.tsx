import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
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
          title: "Board created!",
          description: `${newBoard.name} has been created successfully.`,
        });
      }
    } catch (error) {
      console.error('Error creating board:', error);
      toast({
        title: "Error",
        description: "Failed to create board. Please try again.",
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

  // Fetch discussion boards
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
            .single();

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
        .eq('board_id', selectedBoard as any)
        .eq('approval_status', 'approved' as any)
        .order('created_at', { ascending: true });

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
        .insert(insertData as any);

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
        description: "Failed to send message. Please try again.",
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
    if (!Capacitor.isNativePlatform() || !isMobile) {
      return;
    }

    const backButtonListener = App.addListener('backButton', () => {
      if (showMobileConversation) {
        setShowMobileConversation(false);
      }
    });

    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [isMobile, showMobileConversation]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to access community boards.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Boards sidebar */}
      <div className={`${isMobile && showMobileConversation ? 'hidden' : 'flex'} w-80 border-r flex-col`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Discussion Boards</h2>
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
                <p>No boards yet</p>
                <p className="text-sm">Join or create a board to get started</p>
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
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
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
            <div className="p-4 border-t">
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
                  disabled={!newMessage.trim()}
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
              <p>Select a board to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Board Dialog */}
      <Dialog open={showCreateBoard} onOpenChange={setShowCreateBoard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="board-name">Board Name</Label>
              <Input
                id="board-name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Enter board name"
              />
            </div>
            <div>
              <Label htmlFor="board-description">Description (optional)</Label>
              <Textarea
                id="board-description"
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="Describe what this board is about"
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateBoard(false)}>
                Cancel
              </Button>
              <Button onClick={createBoard} disabled={!newBoardName.trim()}>
                Create Board
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discover Boards Dialog */}
      <Dialog open={showDiscoverBoards} onOpenChange={setShowDiscoverBoards}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Discover Boards</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search boards..."
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