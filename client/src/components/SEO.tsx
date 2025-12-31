import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: object;
}

export default function SEO({
  title = 'A2Z BOOKSHOP - Your Online Book Store',
  description = 'Discover thousands of books at A2Z Bookshop. Buy new and used books online with fast shipping. Fiction, non-fiction, bestsellers, and more.',
  keywords = 'books, online bookstore, buy books, new books, used books, fiction, non-fiction, bestsellers',
  image = 'https://a2zbookshop.com/logo.svg',
  url = 'https://a2zbookshop.com',
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  structuredData
}: SEOProps) {
  const fullTitle = title.includes('A2Z BOOKSHOP') ? title : `${title} | A2Z BOOKSHOP`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="A2Z BOOKSHOP" />
      
      {author && <meta property="article:author" content={author} />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="A2Z BOOKSHOP" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

// Helper function to generate book structured data
export function generateBookStructuredData(book: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": book.title,
    "description": book.description || `${book.title} by ${book.author}`,
    "image": book.imageUrl,
    "isbn": book.isbn,
    "author": {
      "@type": "Person",
      "name": book.author
    },
    "offers": {
      "@type": "Offer",
      "price": book.price,
      "priceCurrency": "INR",
      "availability": book.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": `https://a2zbookshop.com/book/${book.id}`,
      "itemCondition": book.condition === 'New' ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition"
    },
    "aggregateRating": book.rating ? {
      "@type": "AggregateRating",
      "ratingValue": book.rating,
      "reviewCount": book.reviewCount || 1
    } : undefined
  };
}

// Helper for breadcrumb structured data
export function generateBreadcrumbStructuredData(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}
