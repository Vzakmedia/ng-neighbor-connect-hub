import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Calendar } from '@/lib/icons';
import { formatDate, truncateText } from '@/services/blogService';
import type { BlogPost } from '@/hooks/useBlogPosts';

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard = ({ post }: BlogCardProps) => {
  return (
    <Link to={`/blog/${post.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
        {post.featured_image_url && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {post.category && (
              <Badge 
                className="absolute top-4 left-4"
                style={{ backgroundColor: post.category.color }}
              >
                {post.category.name}
              </Badge>
            )}
          </div>
        )}
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-muted-foreground mb-4 line-clamp-3">
              {truncateText(post.excerpt, 150)}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            {post.reading_time_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{post.reading_time_minutes} min read</span>
              </div>
            )}
            {post.published_at && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.published_at)}</span>
              </div>
            )}
          </div>
          {post.author && (
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={post.author.avatar_url || undefined} />
                <AvatarFallback>
                  {post.author.full_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{post.author.full_name}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
