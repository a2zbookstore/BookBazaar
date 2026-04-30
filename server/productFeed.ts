import { storage } from "./storage";
import { generateBookSlug } from "./slugUtils";

/**
 * Google Merchant Center Product Feed Generator
 * Generates RSS 2.0 feed compatible with Google Shopping
 * https://support.google.com/merchants/answer/160589
 */

interface ProductFeedOptions {
  limit?: number;
  includeOutOfStock?: boolean;
}

export async function generateGoogleProductFeed(options: ProductFeedOptions = {}) {
  try {
    const { limit = 5000, includeOutOfStock = false } = options;
    const baseUrl = 'https://a2zbookshop.com';
    
    // Get all books
    const booksResponse = await storage.getBooks({ limit });
    let books = booksResponse.books;

    // Filter out-of-stock if needed
    if (!includeOutOfStock) {
      books = books.filter(book => (book.stock ?? 0) > 0);
    }

    const now = new Date().toUTCString();

    // Start RSS feed with Google Shopping namespace
    let feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>A2Z BOOKSHOP - Books Product Feed</title>
    <link>${baseUrl}</link>
    <description>Complete product catalog for A2Z BOOKSHOP - New &amp; Used Books</description>
    <lastBuildDate>${now}</lastBuildDate>`;

    // Add each book as an item
    for (const book of books) {
      const bookSlug = generateBookSlug(book.title, book.id);
      const bookUrl = `${baseUrl}/books/${bookSlug}`;
      
      // Get proper image URL
      let imageUrl = book.imageUrl || `${baseUrl}/logo.jpeg`;
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${baseUrl}${imageUrl}`;
      }

      // Clean description (remove HTML, limit length)
      const description = book.description
        ? escapeXml(book.description.replace(/<[^>]*>/g, '').substring(0, 5000))
        : `Buy "${escapeXml(book.title)}" by ${escapeXml(book.author)} at A2Z Bookshop. ${book.condition} condition. Worldwide shipping available.`;

      // Determine availability
      const availability = (book.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock';

      // Map book condition to Google's values
      const condition = mapCondition(book.condition);

      // Get category name if available
      const bookCategories = (book as any).categories as Array<{ name: string }> | undefined;
      const categoryName = bookCategories?.[0]?.name || 'Books';

      // Price in INR (Google requires price with currency)
      const price = `${parseFloat(book.price).toFixed(2)} INR`;

      feed += `
    <item>
      <g:id>${book.id}</g:id>
      <g:title>${escapeXml(book.title)}</g:title>
      <g:description>${description}</g:description>
      <g:link>${bookUrl}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:price>${price}</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>${condition}</g:condition>
      <g:brand>${escapeXml(book.author)}</g:brand>
      <g:google_product_category>Media &gt; Books</g:google_product_category>
      <g:product_type>Books &gt; ${escapeXml(categoryName)}</g:product_type>
      <g:identifier_exists>${book.isbn ? 'yes' : 'no'}</g:identifier_exists>`;

      // Add ISBN as GTIN if available
      if (book.isbn) {
        const cleanIsbn = book.isbn.replace(/[^0-9X]/g, '');
        feed += `
      <g:gtin>${cleanIsbn}</g:gtin>`;
      }

      // Add additional attributes
      if (book.binding) {
        feed += `
      <g:item_group_id>${escapeXml(book.title)}</g:item_group_id>`;
      }

      // Add custom labels for filtering
      if (book.featured) {
        feed += `
      <g:custom_label_0>Featured</g:custom_label_0>`;
      }
      if (book.bestseller) {
        feed += `
      <g:custom_label_1>Bestseller</g:custom_label_1>`;
      }
      if (book.newArrival) {
        feed += `
      <g:custom_label_2>New Arrival</g:custom_label_2>`;
      }

      feed += `
    </item>`;
    }

    feed += `
  </channel>
</rss>`;

    return feed;
  } catch (error) {
    console.error('Error generating product feed:', error);
    throw error;
  }
}

/**
 * Map book condition to Google Shopping condition values
 */
function mapCondition(condition: string): string {
  const normalizedCondition = condition.toLowerCase().trim();
  
  if (normalizedCondition === 'new') {
    return 'new';
  } else if (normalizedCondition === 'refurbished' || normalizedCondition === 'like new') {
    return 'refurbished';
  } else {
    // 'Very Good', 'Good', 'Fair', 'Acceptable' all map to 'used'
    return 'used';
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate CSV format feed (alternative to RSS)
 * Useful for Google Merchant Center upload
 */
export async function generateGoogleProductFeedCSV(options: ProductFeedOptions = {}) {
  try {
    const { limit = 5000, includeOutOfStock = false } = options;
    const baseUrl = 'https://a2zbookshop.com';
    
    const booksResponse = await storage.getBooks({ limit });
    let books = booksResponse.books;

    if (!includeOutOfStock) {
      books = books.filter(book => (book.stock ?? 0) > 0);
    }

    // CSV headers (Google Merchant Center required fields)
    let csv = `id,title,description,link,image_link,price,availability,condition,brand,gtin,google_product_category,product_type\n`;

    for (const book of books) {
      const bookSlug = generateBookSlug(book.title, book.id);
      const bookUrl = `${baseUrl}/books/${bookSlug}`;
      
      let imageUrl = book.imageUrl || `${baseUrl}/logo.jpeg`;
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${baseUrl}${imageUrl}`;
      }

      const description = book.description
        ? escapeCsv(book.description.replace(/<[^>]*>/g, '').substring(0, 5000))
        : `Buy "${book.title}" by ${book.author} at A2Z Bookshop. ${book.condition} condition.`;

      const availability = (book.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock';
      const condition = mapCondition(book.condition);
      
      const bookCategories = (book as any).categories as Array<{ name: string }> | undefined;
      const categoryName = bookCategories?.[0]?.name || 'Books';
      
      const price = `${parseFloat(book.price).toFixed(2)} INR`;
      const isbn = book.isbn ? book.isbn.replace(/[^0-9X]/g, '') : '';

      csv += `${book.id},"${escapeCsv(book.title)}","${description}",${bookUrl},${imageUrl},"${price}",${availability},${condition},"${escapeCsv(book.author)}",${isbn},"Media > Books","Books > ${escapeCsv(categoryName)}"\n`;
    }

    return csv;
  } catch (error) {
    console.error('Error generating CSV product feed:', error);
    throw error;
  }
}

/**
 * Escape CSV special characters
 */
function escapeCsv(str: string): string {
  if (!str) return '';
  return str.replace(/"/g, '""');
}
