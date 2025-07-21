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
import FeedAdCard from './FeedAdCard';

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

interface FeedAd {
  id: string;
  business: {
    name: string;
    location: string;
    verified: boolean;
  };
  title: string;
  description: string;
  category: string;
  cta: string;
  url: string;
  promoted: boolean;
  timePosted: string;
  likes: number;
  comments: number;
  rating: number;
  price: string;
  type: 'general' | 'safety' | 'marketplace' | 'event';
  image?: string;
}

type FeedItem = Post | (FeedAd & { isAd: true });

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

  // Feed advertisements data
  const feedAds: FeedAd[] = [
    {
      id: 'ad_1',
      business: {
        name: 'SecureHome Lagos',
        location: 'Victoria Island',
        verified: true,
      },
      title: 'Professional Home Security Installation',
      description: 'Protect your family with our state-of-the-art security systems. 24/7 monitoring, mobile alerts, and professional installation. Special discount for Victoria Island residents.',
      category: 'Security',
      cta: 'Get Free Quote',
      url: 'https://example.com/security',
      promoted: true,
      timePosted: '3 hours ago',
      likes: 18,
      comments: 5,
      rating: 4.8,
      price: 'From ₦120,000',
      type: 'safety',
    },
    {
      id: 'ad_2',
      business: {
        name: 'FreshMart Delivery',
        location: 'Ikoyi',
        verified: true,
      },
      title: 'Same-Day Grocery Delivery',
      description: 'Fresh groceries delivered to your doorstep within 2 hours. Organic produce, household items, and local specialties. Free delivery on orders above ₦10,000.',
      category: 'Grocery',
      image: '/placeholder.svg',
      cta: 'Order Now',
      url: 'https://example.com/groceries',
      promoted: true,
      timePosted: '5 hours ago',
      likes: 24,
      comments: 8,
      rating: 4.9,
      price: 'Free Delivery',
      type: 'general',
    },
    {
      id: 'ad_3',
      business: {
        name: 'TechHub Electronics',
        location: 'Lekki Phase 1',
        verified: true,
      },
      title: 'Electronics Sale - Up to 40% Off',
      description: 'Huge electronics sale! Latest smartphones, laptops, home appliances, and gadgets. All products come with warranty and free technical support.',
      category: 'Electronics',
      cta: 'Shop Sale',
      url: 'https://example.com/electronics',
      promoted: true,
      timePosted: '1 day ago',
      likes: 42,
      comments: 15,
      rating: 4.7,
      price: 'Up to 40% Off',
      type: 'marketplace',
    },
    {
      id: 'ad_4',
      business: {
        name: 'Community Fitness Center',
        location: 'Victoria Island',
        verified: true,
      },
      title: 'Join Our Community Fitness Classes',
      description: 'Group fitness classes for all ages and fitness levels. Yoga, Pilates, cardio, and strength training. First month free for new members!',
      category: 'Health & Fitness',
      cta: 'Join Now',
      url: 'https://example.com/fitness',
      promoted: true,
      timePosted: '2 days ago',
      likes: 31,
      comments: 12,
      rating: 4.6,
      price: 'First Month Free',
      type: 'event',
    }
  ];

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

  // Filter and insert ads based on active tab
  const getRelevantAds = () => {
    let relevantAds = feedAds.filter(ad => {
      if (activeTab === 'all') return true;
      if (activeTab === 'events') return ad.type === 'event';
      if (activeTab === 'safety') return ad.type === 'safety';
      if (activeTab === 'marketplace') return ad.type === 'marketplace';
      return ad.type === activeTab || ad.type === 'general';
    });
    
    // Limit ads to 1-2 per feed to avoid overwhelming users
    return relevantAds.slice(0, activeTab === 'all' ? 2 : 1);
  };

  // Mix posts and ads naturally
  const getMixedFeed = (): FeedItem[] => {
    const relevantAds = getRelevantAds();
    const mixedFeed: FeedItem[] = [...filteredPosts];
    
    // Insert ads at strategic positions (after 2nd and 5th post)
    relevantAds.forEach((ad, index) => {
      const insertPosition = (index + 1) * 3 - 1; // Positions: 2, 5, 8, etc.
      const adItem: FeedItem = { ...ad, isAd: true as const };
      
      if (insertPosition < mixedFeed.length) {
        mixedFeed.splice(insertPosition, 0, adItem);
      } else {
        mixedFeed.push(adItem);
      }
    });
    
    return mixedFeed;
  };

  const mixedFeed = getMixedFeed();

  return (
    <div className="space-y-4">
      {mixedFeed.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No posts found for this category.</p>
        </div>
      ) : (
        mixedFeed.map((item: FeedItem) => {
          // Render advertisement
          if ('isAd' in item && item.isAd) {
            return <FeedAdCard key={item.id} ad={item} />;
          }
          
          // Render regular post
          const post = item as Post;
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