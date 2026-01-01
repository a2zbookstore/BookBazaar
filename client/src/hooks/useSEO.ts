import { useEffect } from 'react';

interface UseSEOParams {
  title?: string;
  description?: string;
  keywords?: string;
}

export function useSEO({ title, description, keywords }: UseSEOParams = {}) {
  useEffect(() => {
    // Update title
    if (title) {
      const fullTitle = title.includes('A2Z BOOKSHOP') ? title : `${title} | A2Z BOOKSHOP`;
      document.title = fullTitle;
    }

    // Update meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }

    // Update meta keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }
  }, [title, description, keywords]);
}
