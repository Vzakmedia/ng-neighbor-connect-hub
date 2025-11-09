import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateReadingTime } from '@/services/blogService';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  author_id: string | null;
  status: 'draft' | 'published' | 'archived';
  category_id: string | null;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[];
  view_count: number;
  reading_time_minutes: number | null;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  author?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export const usePublishedBlogPosts = (filters?: {
  category?: string;
  tag?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['blog-posts', 'published', filters],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug, color),
          author:profiles(id, full_name, avatar_url)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters?.tag) {
        query = query.contains('tags', [filters.tag]);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BlogPost[];
    }
  });
};

export const useBlogPost = (slug: string) => {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug, color),
          author:profiles(id, full_name, avatar_url, bio)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug
  });
};

export const useAllBlogPosts = () => {
  return useQuery({
    queryKey: ['blog-posts', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug, color),
          author:profiles(id, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    }
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: Partial<BlogPost>) => {
      const reading_time = calculateReadingTime(post.content || '');
      
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([{ ...post, reading_time_minutes: reading_time }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Blog post created successfully');
    },
    onError: (error) => {
      console.error('Error creating blog post:', error);
      toast.error('Failed to create blog post');
    }
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BlogPost> & { id: string }) => {
      const reading_time = updates.content ? calculateReadingTime(updates.content) : undefined;
      
      const { data, error } = await supabase
        .from('blog_posts')
        .update({ ...updates, reading_time_minutes: reading_time })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Blog post updated successfully');
    },
    onError: (error) => {
      console.error('Error updating blog post:', error);
      toast.error('Failed to update blog post');
    }
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Blog post deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting blog post:', error);
      toast.error('Failed to delete blog post');
    }
  });
};

export const useIncrementViews = () => {
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.rpc('increment', {
        row_id: postId,
        table_name: 'blog_posts',
        column_name: 'view_count'
      });

      if (error) {
        // Fallback if RPC doesn't exist
        const { data: post } = await supabase
          .from('blog_posts')
          .select('view_count')
          .eq('id', postId)
          .single();

        if (post) {
          await supabase
            .from('blog_posts')
            .update({ view_count: (post.view_count || 0) + 1 })
            .eq('id', postId);
        }
      }
    }
  });
};
