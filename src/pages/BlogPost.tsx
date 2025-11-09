import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBlogPost, useIncrementViews, usePublishedBlogPosts } from '@/hooks/useBlogPosts';
import { BlogContent } from '@/components/blog/BlogContent';
import { BlogSEO } from '@/components/blog/BlogSEO';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import Header from '@/components/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Calendar, Eye } from 'lucide-react';
import { formatDate } from '@/services/blogService';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug!);
  const { data: allPosts } = usePublishedBlogPosts();
  const incrementViews = useIncrementViews();
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);

  useEffect(() => {
    if (post?.id) {
      incrementViews.mutate(post.id);
    }
  }, [post?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 mt-16">
          <Alert variant="destructive">
            <AlertDescription>
              Post not found or failed to load.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const relatedPosts = allPosts?.filter(
    p => p.id !== post.id && 
    (p.category_id === post.category_id || p.tags.some(tag => post.tags.includes(tag)))
  ) || [];

  return (
    <>
      <BlogSEO post={post} />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <article className="container mx-auto px-4 py-8 mt-16">
          {/* Back Button */}
          <Link to="/blog">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </Link>

          {/* Hero Section */}
          <div className="max-w-4xl mx-auto mb-8">
            {post.category && (
              <Badge 
                className="mb-4"
                style={{ backgroundColor: post.category.color }}
              >
                {post.category.name}
              </Badge>
            )}
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-8">
                {post.excerpt}
              </p>
            )}

            {/* Author & Meta Info */}
            <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b">
              {post.author && (
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={post.author.avatar_url || undefined} />
                    <AvatarFallback>
                      {post.author.full_name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{post.author.full_name}</p>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {post.published_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                )}
                {post.reading_time_minutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.reading_time_minutes} min read</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{post.view_count} views</span>
                </div>
              </div>
            </div>

            {/* Share Buttons */}
            <ShareButtons title={post.title} url={`/blog/${post.slug}`} />
          </div>

          {/* Featured Image */}
          {post.featured_image_url && (
            <div className="max-w-4xl mx-auto mb-12">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full rounded-2xl shadow-lg"
              />
            </div>
          )}

          {/* Content with Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <div className="lg:col-span-3">
              <BlogContent 
                content={post.content}
                onHeadingsExtracted={setHeadings}
              />

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t">
                  <h3 className="font-semibold mb-3">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Table of Contents */}
            <div className="lg:col-span-1">
              <TableOfContents headings={headings} />
            </div>
          </div>

          {/* Related Posts */}
          <div className="max-w-7xl mx-auto">
            <RelatedPosts posts={relatedPosts} />
          </div>
        </article>
      </div>
    </>
  );
};

export default BlogPost;
