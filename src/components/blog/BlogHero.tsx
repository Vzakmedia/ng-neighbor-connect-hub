import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight } from 'lucide-react';
import { formatDate } from '@/services/blogService';
import type { BlogPost } from '@/hooks/useBlogPosts';

interface BlogHeroProps {
  post: BlogPost;
}

export const BlogHero = ({ post }: BlogHeroProps) => {
  return (
    <div className="relative h-[500px] rounded-2xl overflow-hidden mb-12">
      {post.featured_image_url && (
        <img
          src={post.featured_image_url}
          alt={post.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex items-end">
        <div className="container mx-auto px-4 pb-12">
          <div className="max-w-3xl">
            {post.category && (
              <Badge 
                className="mb-4"
                style={{ backgroundColor: post.category.color }}
              >
                {post.category.name}
              </Badge>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-lg text-white/90 mb-6">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-4 text-white/80 mb-6">
              {post.author && (
                <span className="font-medium">{post.author.full_name}</span>
              )}
              {post.published_at && (
                <span>{formatDate(post.published_at)}</span>
              )}
              {post.reading_time_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{post.reading_time_minutes} min read</span>
                </div>
              )}
            </div>
            <Link to={`/blog/${post.slug}`}>
              <Button size="lg" className="gap-2">
                Read Article <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
