import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePublishedBlogPosts } from '@/hooks/useBlogPosts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { BookOpen, Calendar, Clock, ArrowRight } from 'lucide-react';
import { formatDate, truncateText } from '@/services/blogService';

export const BlogSection = () => {
  const { data: posts, isLoading } = usePublishedBlogPosts({});

  const featuredPost = posts?.find(post => post.is_featured) || posts?.[0];
  const recentPosts = posts?.slice(0, 6) || [];

  if (isLoading) {
    return (
      <section id="blog" className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <section id="blog" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* BLOG Label with Line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                From Our Blog
              </h2>
            </motion.div>

            {/* Right column - Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center"
            >
              <p className="text-muted-foreground text-lg">
                Insights, stories, and updates from the NeighborLink community
              </p>
            </motion.div>
          </div>

          {/* Empty state card */}
          <Card className="max-w-md p-8">
            <CardContent className="text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
              <p className="text-muted-foreground">
                We're working on bringing you great content. Check back soon for community insights and stories!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="blog" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* BLOG Label with Line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              From Our Blog
            </h2>
          </motion.div>

          {/* Right column - Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center"
          >
            <p className="text-muted-foreground text-lg">
              Insights, stories, and updates from the NeighborLink community
            </p>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto">

          {/* Featured Post */}
          {featuredPost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-12"
            >
            <Link to={`/blog/${featuredPost.slug}`}>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredPost.featured_image_url && (
                    <div className="relative overflow-hidden h-64 md:h-auto">
                      <img
                        src={featuredPost.featured_image_url}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {featuredPost.category && (
                        <Badge
                          className="absolute top-4 left-4"
                          style={{ backgroundColor: featuredPost.category.color }}
                        >
                          {featuredPost.category.name}
                        </Badge>
                      )}
                    </div>
                  )}
                  <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(featuredPost.published_at!)}</span>
                      {featuredPost.reading_time_minutes && (
                        <>
                          <span>•</span>
                          <Clock className="w-4 h-4" />
                          <span>{featuredPost.reading_time_minutes} min read</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h3>
                    {featuredPost.excerpt && (
                      <p className="text-muted-foreground mb-4">
                        {truncateText(featuredPost.excerpt, 200)}
                      </p>
                    )}
                    <div className="flex items-center text-primary font-semibold">
                      Read More <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
            </motion.div>
          )}

          {/* Recent Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
              <Link to={`/blog/${post.slug}`}>
                <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  {post.featured_image_url && (
                    <div className="relative overflow-hidden h-48">
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {post.category && (
                        <Badge
                          className="absolute top-3 left-3"
                          style={{ backgroundColor: post.category.color }}
                        >
                          {post.category.name}
                        </Badge>
                      )}
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(post.published_at!)}</span>
                      {post.reading_time_minutes && (
                        <>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>{post.reading_time_minutes} min</span>
                        </>
                      )}
                    </div>
                    <h4 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h4>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center text-primary text-sm font-semibold">
                      Read More <ArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
          </div>

          {/* View All Posts Button */}
          {posts && posts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-center mt-12"
            >
              <Link to="/blog">
                <Button size="lg" variant="outline" className="group">
                  View All Posts
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
