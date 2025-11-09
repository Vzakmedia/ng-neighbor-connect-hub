import { useEffect, useRef } from 'react';
import { extractHeadings, generateSlug } from '@/services/blogService';

interface BlogContentProps {
  content: string;
  onHeadingsExtracted?: (headings: { id: string; text: string; level: number }[]) => void;
}

export const BlogContent = ({ content, onHeadingsExtracted }: BlogContentProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // Add IDs to headings for TOC navigation
      const headings = contentRef.current.querySelectorAll('h2, h3');
      const extractedHeadings: { id: string; text: string; level: number }[] = [];

      headings.forEach((heading) => {
        const text = heading.textContent || '';
        const id = generateSlug(text);
        const level = parseInt(heading.tagName.substring(1));
        
        heading.id = id;
        extractedHeadings.push({ id, text, level });
      });

      onHeadingsExtracted?.(extractedHeadings);
    }
  }, [content, onHeadingsExtracted]);

  return (
    <div
      ref={contentRef}
      className="prose prose-lg dark:prose-invert max-w-none
        prose-headings:font-bold prose-headings:tracking-tight
        prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
        prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:font-semibold
        prose-ul:my-4 prose-ol:my-4
        prose-li:my-2
        prose-img:rounded-lg prose-img:shadow-lg
        prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-muted prose-pre:border"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
