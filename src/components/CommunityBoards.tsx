import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  MapPin
} from 'lucide-react';

interface ChatMessage {
  id: string;
  author: {
    name: string;
    avatar?: string;
    role: 'admin' | 'moderator' | 'member';
    location: string;
  };
  content: string;
  timestamp: string;
  type: 'message' | 'announcement' | 'poll';
  isPinned?: boolean;
  likes: number;
  replies: number;
  isLiked: boolean;
}

interface ChatGroup {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  isPrivate: boolean;
  lastActivity: string;
  unreadCount: number;
}

const CommunityBoards = () => {
  const [selectedGroup, setSelectedGroup] = useState('general');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const chatGroups: ChatGroup[] = [
    {
      id: 'general',
      name: 'General Discussion',
      description: 'General neighborhood chat for Victoria Island',
      members: 1247,
      category: 'general',
      isPrivate: false,
      lastActivity: '2 minutes ago',
      unreadCount: 3
    },
    {
      id: 'safety',
      name: 'Safety & Security',
      description: 'Report incidents and safety concerns',
      members: 892,
      category: 'safety',
      isPrivate: false,
      lastActivity: '15 minutes ago',
      unreadCount: 1
    },
    {
      id: 'marketplace',
      name: 'Buy & Sell',
      description: 'Local marketplace for neighbors',
      members: 634,
      category: 'marketplace',
      isPrivate: false,
      lastActivity: '1 hour ago',
      unreadCount: 0
    },
    {
      id: 'events',
      name: 'Events & Gatherings',
      description: 'Organize and discover community events',
      members: 445,
      category: 'events',
      isPrivate: false,
      lastActivity: '3 hours ago',
      unreadCount: 5
    },
    {
      id: 'parents',
      name: 'Parents Group',
      description: 'For parents in the neighborhood',
      members: 178,
      category: 'lifestyle',
      isPrivate: true,
      lastActivity: '30 minutes ago',
      unreadCount: 2
    }
  ];

  const sampleMessages: ChatMessage[] = [
    {
      id: '1',
      author: {
        name: 'Kemi Adebayo',
        role: 'admin',
        location: 'Victoria Island'
      },
      content: 'Welcome everyone to our community board! Please keep discussions respectful and helpful. 📢',
      timestamp: '2 hours ago',
      type: 'announcement',
      isPinned: true,
      likes: 24,
      replies: 8,
      isLiked: false
    },
    {
      id: '2',
      author: {
        name: 'Chukwuma Obi',
        role: 'member',
        location: 'Lekki Phase 1'
      },
      content: 'Has anyone noticed the new pothole on Adeola Odeku Street? We should report this to the authorities.',
      timestamp: '45 minutes ago',
      type: 'message',
      likes: 12,
      replies: 15,
      isLiked: true
    },
    {
      id: '3',
      author: {
        name: 'Fatima Ibrahim',
        role: 'moderator',
        location: 'Victoria Island'
      },
      content: 'Don\'t forget about the community cleanup this Saturday! Still looking for 20 more volunteers. 🧹',
      timestamp: '30 minutes ago',
      type: 'message',
      likes: 18,
      replies: 6,
      isLiked: false
    },
    {
      id: '4',
      author: {
        name: 'Adaora Okafor',
        role: 'member',
        location: 'Ikoyi'
      },
      content: 'Thank you to everyone who helped with the lost cat situation yesterday! Mr. Whiskers is home safe. ❤️',
      timestamp: '15 minutes ago',
      type: 'message',
      likes: 35,
      replies: 12,
      isLiked: true
    }
  ];

  useEffect(() => {
    setMessages(sampleMessages);
  }, [selectedGroup]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'moderator':
        return <Crown className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="text-xs">Admin</Badge>;
      case 'moderator':
        return <Badge variant="secondary" className="text-xs">Mod</Badge>;
      default:
        return null;
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      author: {
        name: 'You',
        role: 'member',
        location: 'Victoria Island'
      },
      content: newMessage,
      timestamp: 'Just now',
      type: 'message',
      likes: 0,
      replies: 0,
      isLiked: false
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const toggleLike = (messageId: string) => {
    setMessages(messages.map(msg => 
      msg.id === messageId 
        ? { ...msg, isLiked: !msg.isLiked, likes: msg.isLiked ? msg.likes - 1 : msg.likes + 1 }
        : msg
    ));
  };

  const currentGroup = chatGroups.find(group => group.id === selectedGroup);

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-background">
      {/* Groups Sidebar */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Community Boards</h2>
            <Button size="sm" className="h-8">
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search groups..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto">
          {chatGroups
            .filter(group => group.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`p-4 cursor-pointer transition-colors border-b hover:bg-muted/50 ${
                selectedGroup === group.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{group.name}</h3>
                {group.unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {group.unreadCount}
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{group.description}</p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {group.members} members
                </div>
                <span>{group.lastActivity}</span>
              </div>
              
              <div className="flex items-center mt-2 space-x-2">
                <Badge variant="outline" className="text-xs">{group.category}</Badge>
                {group.isPrivate && (
                  <Badge variant="secondary" className="text-xs">Private</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{currentGroup?.name}</h2>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                {currentGroup?.members} members
                <MapPin className="h-4 w-4 ml-3 mr-1" />
                Victoria Island Community
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Pin className="h-4 w-4 mr-1" />
                Pinned
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`relative ${message.isPinned ? 'bg-primary/5 rounded-lg p-3' : ''}`}>
              {message.isPinned && (
                <div className="flex items-center text-xs text-primary mb-2">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned message
                </div>
              )}
              
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.author.avatar} />
                  <AvatarFallback className="text-xs">
                    {message.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm">{message.author.name}</span>
                    {getRoleIcon(message.author.role)}
                    {getRoleBadge(message.author.role)}
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {message.author.location}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {message.timestamp}
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3 leading-relaxed">{message.content}</p>
                  
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(message.id)}
                      className={`h-7 px-2 ${message.isLiked ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                      <Heart className={`h-3 w-3 mr-1 ${message.isLiked ? 'fill-current' : ''}`} />
                      {message.likes}
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
                      <Reply className="h-3 w-3 mr-1" />
                      {message.replies}
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-card">
          <div className="flex items-end space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">You</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Textarea
                placeholder={`Message ${currentGroup?.name}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="min-h-[40px] max-h-32 resize-none"
              />
            </div>
            
            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityBoards;