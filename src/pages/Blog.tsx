import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePublishedBlogPosts } from '@/hooks/useBlogPosts';
import { BlogCard } from '@/components/blog/BlogCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { BookOpen, ArrowLeft, Search, Newspaper, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const Blog = () => {
  const { data: posts, isLoading } = usePublishedBlogPosts({});
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: Newspaper,
      title: "Community News",
      count: posts?.filter(p => p.category?.name === "Community").length || 0,
      color: "text-blue-500",
    },
    {
      icon: TrendingUp,
      title: "Safety Tips",
      count: posts?.filter(p => p.category?.name === "Safety").length || 0,
      color: "text-red-500",
    },
    {
      icon: Clock,
      title: "Recent Updates",
      count: posts?.filter(p => p.category?.name === "Updates").length || 0,
      color: "text-green-500",
    },
  ];

  const filteredPosts = posts?.filter(post =>
    searchQuery === "" ||
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="container py-8 max-w-6xl">
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

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search blog posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {categories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3 ${category.color}`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{category.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {category.count} {category.count === 1 ? 'post' : 'posts'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="mb-12">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : !filteredPosts || filteredPosts.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="text-center py-12">
                <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? "No posts found" : "No Posts Yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Try different keywords or browse all posts" 
                    : "We're working on bringing you great content. Check back soon!"}
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {searchQuery && (
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Found {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post, index) => (
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
      </div>
    </div>
  );
};

export default Blog;
