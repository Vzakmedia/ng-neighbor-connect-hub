import { useState, useEffect, useRef } from 'react';
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
  Trash2,
  CheckCircle,
  Check
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
  location_scope: 'neighborhood' | 'city' | 'state' | 'public';
  requires_approval: boolean;
  auto_approve_members: boolean;
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
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
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
  const [loading, setLoading] = useState(true);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showDiscoverBoards, setShowDiscoverBoards] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newBoardIsPublic, setNewBoardIsPublic] = useState(true);
  const [showingDiscoveredBoards, setShowingDiscoveredBoards] = useState(false);

  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

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
          profiles!board_posts_user_id_fkey (
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
            is_liked_by_user: !!userLike
          };
        })
      );

      setPosts(postsWithLikes as BoardPost[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!selectedBoard || !newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('board_posts')
        .insert({
          board_id: selectedBoard,
          user_id: user.id,
          content: newMessage.trim(),
          post_type: 'message'
        });

      if (error) throw error;

      setNewMessage('');
      fetchPosts();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchBoards();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBoard) {
      fetchPosts();
    }
  }, [selectedBoard]);

  const currentBoard = boards.find(b => b.id === selectedBoard);
  const displayBoards = showingDiscoveredBoards ? publicBoards : boards;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-12rem)] bg-background overflow-hidden">
      {/* Boards Sidebar */}
      <div className="w-full md:w-80 border-b md:border-r md:border-b-0 bg-card flex-shrink-0">
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

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedBoard && currentBoard ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{currentBoard.name}</h2>
                  {currentBoard.description && (
                    <p className="text-sm text-muted-foreground">{currentBoard.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {currentBoard.member_count} members
                  </Badge>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
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
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="text-sm mt-1">{post.content}</p>
                      {post.likes_count > 0 && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Heart className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-muted-foreground">
                            {post.likes_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
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
    </div>
  );
};

export default CommunityBoards;