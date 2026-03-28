import { storage } from "./storage";
import { generateBookSlug } from "./slugUtils";

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
      { url: '/terms-and-conditions', priority: '0.5', changefreq: 'yearly' },
      { url: '/cancellation-policy', priority: '0.5', changefreq: 'yearly' },
      { url: '/privacy-policy', priority: '0.5', changefreq: 'yearly' },
      { url: '/about', priority: '0.6', changefreq: 'monthly' },
      { url: '/gift-items', priority: '0.7', changefreq: 'weekly' },
    ];

    const today = new Date().toISOString().split('T')[0];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static pages
    staticPages.forEach(page => {
      sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
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
      const bookUrl = `/books/${generateBookSlug(book.title, book.id)}`;
      const lastmod = book.updatedAt || book.createdAt
        ? new Date(book.updatedAt || book.createdAt).toISOString().split('T')[0]
        : today;
      sitemap += `
  <url>
    <loc>${baseUrl}${bookUrl}</loc>
    <lastmod>${lastmod}</lastmod>
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
