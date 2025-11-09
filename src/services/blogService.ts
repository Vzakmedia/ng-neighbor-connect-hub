export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

export const extractHeadings = (content: string): { id: string; text: string; level: number }[] => {
  const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h\1>/gi;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]*>/g, '');
    const id = generateSlug(text);
    headings.push({ id, text, level });
  }

  return headings;
};

export const validateSEO = (post: {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  title: string;
  excerpt?: string;
}): { score: number; issues: string[] } => {
  const issues: string[] = [];
  let score = 100;

  const metaTitle = post.meta_title || post.title;
  if (metaTitle.length > 60) {
    issues.push('Meta title should be under 60 characters');
    score -= 20;
  }
  if (metaTitle.length < 30) {
    issues.push('Meta title should be at least 30 characters');
    score -= 10;
  }

  const metaDesc = post.meta_description || post.excerpt || '';
  if (metaDesc.length > 160) {
    issues.push('Meta description should be under 160 characters');
    score -= 20;
  }
  if (metaDesc.length < 120) {
    issues.push('Meta description should be at least 120 characters');
    score -= 10;
  }

  if (!post.meta_keywords || post.meta_keywords.length === 0) {
    issues.push('Add at least one keyword');
    score -= 10;
  }

  return { score: Math.max(0, score), issues };
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
};
