import { motion } from 'framer-motion';
import { usePublishedBlogPosts } from '@/hooks/useBlogPosts';
import { BlogCard } from '@/components/blog/BlogCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Blog = () => {
  const { data: posts, isLoading } = usePublishedBlogPosts({});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-24 px-6 md:px-12 lg:px-16 xl:px-24 bg-muted/30">
        <div className="w-full">
          {/* BLOG Label with Line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-0.5 h-6 bg-primary"></div>
            <div className="text-primary text-sm font-medium tracking-wider">BLOG</div>
          </motion.div>

          {/* Two-column header */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Left column - Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                From Our Blog
              </h1>
            </motion.div>

            {/* Right column - Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center"
            >
              <p className="text-muted-foreground text-lg">
                Explore insights, stories, and updates from the NeighborLink community
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 px-6 md:px-12 lg:px-16 xl:px-24">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : !posts || posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="max-w-md mx-auto p-8">
                <CardContent className="text-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
                  <p className="text-muted-foreground">
                    We're working on bringing you great content. Check back soon!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          )}
        </div>
      </section>
    </div>
  );
};

export default Blog;
