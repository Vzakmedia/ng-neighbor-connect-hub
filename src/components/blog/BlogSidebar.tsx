import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { usePublishedBlogPosts } from '@/hooks/useBlogPosts';
import { Link } from 'react-router-dom';

interface BlogSidebarProps {
  onSearch?: (query: string) => void;
  onCategorySelect?: (categoryId: string) => void;
  onTagSelect?: (tag: string) => void;
}

export const BlogSidebar = ({ onSearch, onCategorySelect, onTagSelect }: BlogSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: categories } = useBlogCategories();
  const { data: posts } = usePublishedBlogPosts();

  const allTags = posts
    ? Array.from(new Set(posts.flatMap(post => post.tags)))
    : [];

  const recentPosts = posts?.slice(0, 5) || [];

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories?.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect?.(category.id)}
                className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent transition-colors text-left"
              >
                <span className="font-medium">{category.name}</span>
                <Badge variant="secondary">{category.post_count}</Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      {allTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => onTagSelect?.(tag)}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="block group"
              >
                <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2 mb-1">
                  {post.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {post.reading_time_minutes} min read
                </p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
