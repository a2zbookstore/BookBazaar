import { storage } from "./storage";

export async function generateSitemap() {
  try {
    const baseUrl = 'https://a2zbookshop.com'; // Update with your actual domain

    // Get all books, categories
    const booksResponse = await storage.getBooks({ limit: 10000 });
    const books = booksResponse.books;
    const categories = await storage.getCategories();

    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/catalog', priority: '0.9', changefreq: 'daily' },
      { url: '/contact', priority: '0.7', changefreq: 'monthly' },
      { url: '/faq', priority: '0.6', changefreq: 'monthly' },
      { url: '/shipping-info', priority: '0.6', changefreq: 'monthly' },
      { url: '/return-policy', priority: '0.6', changefreq: 'monthly' },
      { url: '/terms', priority: '0.5', changefreq: 'yearly' },
      { url: '/cancellation-policy', priority: '0.5', changefreq: 'yearly' },
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static pages
    staticPages.forEach(page => {
      sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // Add category pages
    categories.forEach((category: any) => {
      sitemap += `
  <url>
    <loc>${baseUrl}/catalog?category=${encodeURIComponent(category.name)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add book pages (individual book detail pages if you have them)
    books.forEach((book: any) => {
      sitemap += `
  <url>
    <loc>${baseUrl}/book/${book.id}</loc>
    <lastmod>${book.updatedAt || book.createdAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    return sitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
}

export function generateRobotsTxt() {
  const baseUrl = 'https://a2zbookshop.com'; // Update with your actual domain

  return `# Robots.txt for A2Z BOOKSHOP

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout
Disallow: /my-orders
Disallow: /wishlist

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1
`;
}
