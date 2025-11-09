import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePublishedBlogPosts } from '@/hooks/useBlogPosts';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { BookOpen, ArrowLeft, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: posts, isLoading } = usePublishedBlogPosts({
    category: selectedCategory || undefined,
    tag: selectedTag || undefined,
    search: searchQuery || undefined,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    setSelectedTag(null);
    setSearchQuery("");
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
    setSelectedCategory(null);
    setSearchQuery("");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedTag;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/landing">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Blog</h1>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <BookOpen className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">From Our Blog</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Explore insights, stories, and updates from the NeighborLink community
          </p>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setSearchQuery("")}
                />
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                Category filter
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setSelectedCategory(null)}
                />
              </Badge>
            )}
            {selectedTag && (
              <Badge variant="secondary" className="gap-1">
                #{selectedTag}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setSelectedTag(null)}
                />
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearFilters}
              className="h-6 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Main Content with Sidebar */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Blog Posts */}
          <div>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : !posts || posts.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {hasActiveFilters ? "No posts found" : "No Posts Yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {hasActiveFilters 
                      ? "Try adjusting your filters or browse all posts" 
                      : "We're working on bringing you great content. Check back soon!"}
                  </p>
                  {hasActiveFilters && (
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                    >
                      <BlogCard post={post} />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <BlogSidebar
              onSearch={handleSearch}
              onCategorySelect={handleCategorySelect}
              onTagSelect={handleTagSelect}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Blog;
