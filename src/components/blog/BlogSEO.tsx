import { Helmet } from 'react-helmet-async';
import type { BlogPost } from '@/hooks/useBlogPosts';

interface BlogSEOProps {
  post: BlogPost;
}

export const BlogSEO = ({ post }: BlogSEOProps) => {
  const metaTitle = post.meta_title || post.title;
  const metaDescription = post.meta_description || post.excerpt || '';
  const keywords = post.meta_keywords?.join(', ') || '';
  const url = `${window.location.origin}/blog/${post.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.featured_image_url,
    "author": {
      "@type": "Person",
      "name": post.author?.full_name || "NeighborLink"
    },
    "datePublished": post.published_at,
    "dateModified": post.updated_at,
    "description": metaDescription
  };

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      {post.featured_image_url && <meta property="og:image" content={post.featured_image_url} />}
      <meta property="og:url" content={url} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {post.featured_image_url && <meta name="twitter:image" content={post.featured_image_url} />}
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};
