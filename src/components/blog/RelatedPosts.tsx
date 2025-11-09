import { BlogCard } from './BlogCard';
import type { BlogPost } from '@/hooks/useBlogPosts';

interface RelatedPostsProps {
  posts: BlogPost[];
}

export const RelatedPosts = ({ posts }: RelatedPostsProps) => {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.slice(0, 3).map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
};
