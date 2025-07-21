import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  MapPin,
  Clock,
  AlertTriangle,
  ShoppingCart,
  Users
} from 'lucide-react';

interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
    location: string;
  };
  content: string;
  type: 'general' | 'safety' | 'marketplace' | 'help' | 'event';
  timestamp: string;
  likes: number;
  comments: number;
  image?: string;
  isLiked: boolean;
}

interface CommunityFeedProps {
  activeTab?: string;
}

const CommunityFeed = ({ activeTab = 'all' }: CommunityFeedProps) => {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: {
        name: 'Adaora Okafor',
        location: 'Victoria Island',
      },
      content: 'Lost my cat Mr. Whiskers around Adeola Odeku Street. He\'s a grey tabby with white paws. Please help me find him! 🐱',
      type: 'help',
      timestamp: '2 hours ago',
      likes: 12,
      comments: 8,
      isLiked: false,
    },
    {
      id: '2',
      author: {
        name: 'Kemi Adebayo',
        location: 'Ikoyi',
      },
      content: 'SAFETY ALERT: Suspicious activity reported near the shopping complex on Awolowo Road around 8 PM. Please be cautious if walking alone.',
      type: 'safety',
      timestamp: '4 hours ago',
      likes: 28,
      comments: 15,
      isLiked: true,
    },
    {
      id: '3',
      author: {
        name: 'Chukwuma Obi',
        location: 'Lekki Phase 1',
      },
      content: 'Selling a barely used Samsung 65" Smart TV. Perfect condition, still under warranty. ₦250,000 or best offer. Pickup only.',
      type: 'marketplace',
      timestamp: '1 day ago',
      likes: 5,
      comments: 12,
      isLiked: false,
    },
    {
      id: '4',
      author: {
        name: 'Fatima Ibrahim',
        location: 'Victoria Island',
      },
      content: 'Community cleanup this Saturday at 9 AM! Let\'s keep our neighborhood beautiful. Bring gloves and water. Free breakfast for all volunteers! 🌱',
      type: 'event',
      timestamp: '2 days ago',
      likes: 45,
      comments: 23,
      isLiked: true,
    },
  ]);

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'safety':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'marketplace':
        return <ShoppingCart className="h-4 w-4 text-community-green" />;
      case 'help':
        return <Users className="h-4 w-4 text-community-blue" />;
      case 'event':
        return <Users className="h-4 w-4 text-community-yellow" />;
      default:
        return null;
    }
  };

  const getPostTypeBadge = (type: string) => {
    const badges = {
      safety: { label: 'Safety Alert', variant: 'destructive' as const },
      marketplace: { label: 'For Sale', variant: 'secondary' as const },
      help: { label: 'Need Help', variant: 'outline' as const },
      event: { label: 'Community Event', variant: 'default' as const },
      general: { label: 'General', variant: 'outline' as const },
    };
    
    return badges[type as keyof typeof badges] || badges.general;
  };

  const toggleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  // Filter posts based on active tab
  const filteredPosts = posts.filter(post => {
    if (activeTab === 'all') return true;
    if (activeTab === 'events') return post.type === 'event';
    if (activeTab === 'safety') return post.type === 'safety';
    if (activeTab === 'marketplace') return post.type === 'marketplace';
    return post.type === activeTab;
  });

  return (
    <div className="space-y-4">
      {filteredPosts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No posts found for this category.</p>
        </div>
      ) : (
        filteredPosts.map((post) => {
        const typeBadge = getPostTypeBadge(post.type);
        return (
          <Card key={post.id} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback>{post.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{post.author.name}</h4>
                      <Badge variant={typeBadge.variant} className="text-xs">
                        {getPostTypeIcon(post.type)}
                        <span className="ml-1">{typeBadge.label}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{post.author.location}</span>
                      <Clock className="h-3 w-3 ml-2" />
                      <span>{post.timestamp}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm leading-relaxed mb-4">{post.content}</p>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleLike(post.id)}
                    className={`${post.isLiked ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {post.comments}
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
        })
      )}
    </div>
  );
};

export default CommunityFeed;