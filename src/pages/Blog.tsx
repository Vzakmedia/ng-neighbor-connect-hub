import { useState } from 'react';
import { usePublishedBlogPosts } from '@/hooks/useBlogPosts';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogHero } from '@/components/blog/BlogHero';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import Header from '@/components/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Blog = () => {
  const [filters, setFilters] = useState<{
    search?: string;
    category?: string;
    tag?: string;
  }>({});

  const { data: posts, isLoading, error } = usePublishedBlogPosts(filters);

  const featuredPost = posts?.find(post => post.is_featured) || posts?.[0];
  const regularPosts = posts?.filter(post => post.id !== featuredPost?.id) || [];

  return (
    <>
      <Helmet>
        <title>Blog - NeighborLink</title>
        <meta 
          name="description" 
          content="Stay updated with the latest news, tips, and stories from the NeighborLink community." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8 mt-16">
          {/* Hero Section */}
          {featuredPost && (
            <BlogHero post={featuredPost} />
          )}

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
              <BookOpen className="w-10 h-10 text-primary" />
              Our Blog
            </h1>
            <p className="text-muted-foreground text-lg">
              Insights, stories, and updates from the NeighborLink community
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to load blog posts. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : regularPosts.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No posts found</h3>
                  <p className="text-muted-foreground">
                    {filters.search || filters.category || filters.tag
                      ? 'Try adjusting your filters'
                      : 'Check back soon for new content'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regularPosts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <BlogSidebar
                onSearch={(search) => setFilters(prev => ({ ...prev, search }))}
                onCategorySelect={(category) => setFilters(prev => ({ ...prev, category }))}
                onTagSelect={(tag) => setFilters(prev => ({ ...prev, tag }))}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Blog;
