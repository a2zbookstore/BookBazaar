/**
 * Server-side meta tag injector for SSR SEO.
 *
 * The React app is a client-side SPA, so Googlebot normally receives a nearly
 * empty <div id="root"></div>.  This module intercepts every HTML response and
 * stamps the correct <title>, <meta>, Open Graph, Twitter-card, canonical
 * <link>, and JSON-LD structured-data tags into the static shell *before* it
 * is sent to the client.  For book-detail pages it also injects a visually
 * hidden content block so Googlebot can read the book title, author, price and
 * description without executing JavaScript.
 *
 * Result: crawlers see fully-populated meta tags on the first HTTP response;
 * regular users still get the full interactive React app.
 */

import { storage } from "./storage";
import { extractBookIdFromSlug } from "./slugUtils";

const BASE_URL = "https://a2zbookshop.com";

/** Escape a string for use inside an HTML attribute value (double-quoted). */
function ea(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Escape a string for use as HTML text content. */
function et(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// Prerender helpers — build visually-hidden HTML blocks with real content
// so Googlebot can read and index pages without executing JavaScript.
// The blocks are positioned off-screen (clip/overflow:hidden) so they are
// invisible to human users but fully readable by crawlers.
// ---------------------------------------------------------------------------

/**
 * Fetch books from the DB and build a hidden HTML book-list section.
 * Returns both the HTML string and the total number of matching books.
 */
async function buildCatalogPrerender(
  heading: string,
  filter: {
    search?: string;
    categoryId?: number;
    featured?: boolean;
    bestseller?: boolean;
    trending?: boolean;
    newArrival?: boolean;
    boxSet?: boolean;
  },
  limit = 30
): Promise<{ html: string; total: number }> {
  try {
    const { books, total } = await storage.getBooks({
      ...filter,
      limit,
      offset: 0,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    if (books.length === 0) return { html: "", total: 0 };

    const listItems = books
      .map(
        (b) =>
          `    <li><a href="${BASE_URL}/books/${b.id}">${et(b.title)} by ${
            et(b.author)
          } — ${et(b.condition)} — &#8377;${et(String(b.price))}</a></li>`
      )
      .join("\n");

    const html =
      `<section id="ssr-catalog" style="position:absolute;width:1px;height:1px;` +
      `overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;" aria-hidden="true">\n` +
      `  <h1>${et(heading)}</h1>\n` +
      `  <p>${total} books available at A2Z Bookshop</p>\n` +
      `  <ul>\n${listItems}\n  </ul>\n` +
      `</section>`;

    return { html, total };
  } catch {
    return { html: "", total: 0 };
  }
}

/**
 * Fetch featured, bestselling, and new-arrival books and build a hidden
 * HTML section for the homepage so crawlers see real book content.
 */
async function buildHomepagePrerender(): Promise<string> {
  try {
    const [featuredRes, bestsellerRes, newArrivalRes] = await Promise.all([
      storage.getBooks({ featured: true, limit: 8, offset: 0 }),
      storage.getBooks({ bestseller: true, limit: 8, offset: 0 }),
      storage.getBooks({ newArrival: true, limit: 8, offset: 0 }),
    ]);

    const renderSection = (sectionTitle: string, books: typeof featuredRes.books) => {
      if (books.length === 0) return "";
      const items = books
        .map(
          (b) =>
            `    <li><a href="${BASE_URL}/books/${b.id}">${et(b.title)} by ${
              et(b.author)
            } — &#8377;${et(String(b.price))}</a></li>`
        )
        .join("\n");
      return `  <section>\n    <h2>${et(sectionTitle)}</h2>\n    <ul>\n${items}\n    </ul>\n  </section>`;
    };

    const sections = [
      renderSection("Featured Books", featuredRes.books),
      renderSection("Bestselling Books", bestsellerRes.books),
      renderSection("New Arrivals", newArrivalRes.books),
    ]
      .filter(Boolean)
      .join("\n");

    if (!sections) return "";

    return (
      `<div id="ssr-homepage" style="position:absolute;width:1px;height:1px;` +
      `overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;" aria-hidden="true">\n` +
      `  <h1>A2Z BOOKSHOP — Buy Books Online | New &amp; Used Books</h1>\n` +
      sections +
      `\n</div>`
    );
  } catch {
    return "";
  }
}

interface PageMeta {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  canonical: string;
  type: string;
  noindex: boolean;
  structuredData: object | object[];
  /** Visually hidden HTML block for crawlers (book pages only). */
  prerenderedHtml?: string;
}

// ---------------------------------------------------------------------------
// Route-specific meta resolution
// ---------------------------------------------------------------------------

async function resolvePageMeta(url: string): Promise<PageMeta> {
  const [rawPath] = url.split("?");
  const urlPath = rawPath.replace(/\/$/, "") || "/";

  // ── Book detail: /books/:id or /books/:slug ──────────────────────────────
  const bookMatch = urlPath.match(/^\/books\/([^/]+)$/);
  if (bookMatch) {
    const slugOrId = bookMatch[1];
    try {
      // Extract ID from slug or parse as numeric ID
      const bookId = extractBookIdFromSlug(slugOrId);
      if (!bookId) {
        // Invalid format, continue to default
        return resolveDefaultMeta(urlPath);
      }
      
      const book = await storage.getBookById(bookId);
      if (book) {
        const rawDesc = book.description?.trim() ?? "";
        const description = rawDesc
          ? rawDesc.length > 160
            ? rawDesc.slice(0, 157) + "..."
            : rawDesc
          : `Buy "${book.title}" by ${book.author} at A2Z Bookshop. ${book.condition} condition. Fast delivery across India with secure payment.`;

        const title = `${book.title} by ${book.author} | A2Z BOOKSHOP`;
        const imageUrl =
          book.imageUrl?.startsWith("http")
            ? book.imageUrl
            : `${BASE_URL}${book.imageUrl || "/logo.jpeg"}`;
        const canonical = `${BASE_URL}/books/${book.id}`;

        const bookSchema: Record<string, unknown> = {
          "@context": "https://schema.org",
          "@type": "Book",
          name: book.title,
          author: { "@type": "Person", name: book.author },
          description,
          image: imageUrl,
          offers: {
            "@type": "Offer",
            price: String(book.price),
            priceCurrency: "INR",
            availability:
              (book.stock ?? 0) > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url: canonical,
            itemCondition:
              book.condition === "New"
                ? "https://schema.org/NewCondition"
                : "https://schema.org/UsedCondition",
            seller: { "@type": "Organization", name: "A2Z BOOKSHOP" },
          },
        };
        if (book.isbn) bookSchema.isbn = book.isbn;
        const bookCategories = (book as any).categories as
          | Array<{ name: string }>
          | undefined;
        if (bookCategories?.length) bookSchema.genre = bookCategories[0].name;

        const breadcrumbSchema = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            {
              "@type": "ListItem",
              position: 2,
              name: "Catalog",
              item: `${BASE_URL}/catalog`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: book.title,
              item: canonical,
            },
          ],
        };

        // Visually hidden content for crawlers (CSS clip-path hides from users)
        const prerenderedHtml = `<div id="ssr-book-content" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;" aria-hidden="true">
  <h1>${et(book.title)}</h1>
  <p>By ${et(book.author)}</p>
  <p>Price: &#8377;${et(String(book.price))}</p>
  ${book.condition ? `<p>Condition: ${et(book.condition)}</p>` : ""}
  ${book.isbn ? `<p>ISBN: ${et(book.isbn)}</p>` : ""}
  ${rawDesc ? `<p>${et(rawDesc.slice(0, 500))}</p>` : ""}
  ${bookCategories?.length ? `<p>Category: ${et(bookCategories[0].name)}</p>` : ""}
</div>`;

        return {
          title,
          description,
          keywords: `${book.title}, ${book.author}, buy ${book.title} online, A2Z bookshop, ${book.condition} book${book.isbn ? `, ISBN ${book.isbn}` : ""}`,
          ogImage: imageUrl,
          canonical,
          type: "product",
          noindex: false,
          structuredData: [bookSchema, breadcrumbSchema],
          prerenderedHtml,
        };
      }
    } catch {
      // Fall through to default
    }
  }

  // ── Homepage: / ───────────────────────────────────────────────────────────
  if (urlPath === "/") {
    const prerenderedHtml = await buildHomepagePrerender();
    return {
      title: "A2Z BOOKSHOP - Buy Books Online | New & Used Books",
      description:
        "Discover thousands of books at A2Z Bookshop. Best prices on fiction, non-fiction, bestsellers, trending books and more. Fast shipping across India with secure payment.",
      keywords:
        "buy books online, online bookstore India, new books, used books, fiction, non-fiction, bestsellers, trending books, book store",
      ogImage: `${BASE_URL}/logo.jpeg`,
      canonical: BASE_URL,
      type: "website",
      noindex: false,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "A2Z BOOKSHOP",
        url: BASE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${BASE_URL}/catalog?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      prerenderedHtml: prerenderedHtml || undefined,
    };
  }

  // ── Catalog: /catalog ────────────────────────────────────────────────────
  if (urlPath === "/catalog") {
    const params = new URLSearchParams(url.split("?")[1] ?? "");
    const search = params.get("search") ?? undefined;
    const categoryIdRaw = params.get("categoryId");
    const categoryId = categoryIdRaw ? parseInt(categoryIdRaw, 10) : undefined;
    const featured = params.get("featured") === "true" ? true : undefined;
    const bestseller = params.get("bestseller") === "true" ? true : undefined;
    const trending = params.get("trending") === "true" ? true : undefined;
    const newArrival = params.get("newArrival") === "true" ? true : undefined;
    const boxSet = params.get("boxSet") === "true" ? true : undefined;

    let heading = "All Books — Browse Our Complete Collection";
    let metaTitle = "All Books — Browse Our Complete Collection | A2Z BOOKSHOP";
    let metaDesc =
      "Browse thousands of books across all categories. Fiction, non-fiction, bestsellers and more. Best prices with fast delivery across India.";
    const metaKeywords =
      "buy books, book catalog, fiction books, non-fiction books, bestsellers, online bookstore India, book store";
    let canonical = `${BASE_URL}/catalog`;

    if (search) {
      heading = `Search Results for "${search}"`;
      metaTitle = `Books matching "${search}" | A2Z BOOKSHOP`;
      metaDesc = `Find books matching "${search}" at A2Z Bookshop. Buy online with fast delivery.`;
      canonical = `${BASE_URL}/catalog?search=${encodeURIComponent(search)}`;
    } else if (featured) {
      heading = "Featured Books";
      metaTitle = "Featured Books | A2Z BOOKSHOP";
      metaDesc = "Browse our hand-picked featured books at A2Z Bookshop. Top titles, best prices, fast delivery.";
      canonical = `${BASE_URL}/catalog?featured=true`;
    } else if (bestseller) {
      heading = "Bestselling Books";
      metaTitle = "Bestselling Books | A2Z BOOKSHOP";
      metaDesc = "Shop our bestselling books at A2Z Bookshop. Top reads with fast delivery across India.";
      canonical = `${BASE_URL}/catalog?bestseller=true`;
    } else if (trending) {
      heading = "Trending Books";
      metaTitle = "Trending Books | A2Z BOOKSHOP";
      metaDesc = "Discover trending books everyone is reading. Shop now at A2Z Bookshop.";
      canonical = `${BASE_URL}/catalog?trending=true`;
    } else if (newArrival) {
      heading = "New Arrivals";
      metaTitle = "New Arrivals | A2Z BOOKSHOP";
      metaDesc = "Explore our latest book arrivals. Fresh stock added regularly at A2Z Bookshop.";
      canonical = `${BASE_URL}/catalog?newArrival=true`;
    } else if (boxSet) {
      heading = "Book Box Sets";
      metaTitle = "Book Box Sets | A2Z BOOKSHOP";
      metaDesc = "Shop complete book box sets and series collections at A2Z Bookshop.";
      canonical = `${BASE_URL}/catalog?boxSet=true`;
    } else if (categoryId) {
      canonical = `${BASE_URL}/catalog?categoryId=${categoryId}`;
    }

    const { html: prerenderedHtml, total } = await buildCatalogPrerender(
      heading,
      { search, categoryId, featured, bestseller, trending, newArrival, boxSet },
      30
    );

    if (total > 0 && !search && !categoryId) {
      metaDesc = `Browse ${total}+ books at A2Z Bookshop. Fiction, non-fiction, bestsellers and more. Fast delivery across India.`;
    }

    return {
      title: metaTitle,
      description: metaDesc,
      keywords: metaKeywords,
      ogImage: `${BASE_URL}/logo.jpeg`,
      canonical,
      type: "website",
      noindex: false,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: heading,
        description: metaDesc,
        url: canonical,
        provider: { "@type": "Organization", name: "A2Z BOOKSHOP" },
      },
      prerenderedHtml: prerenderedHtml || undefined,
    };
  }

  // ── Admin pages — noindex ────────────────────────────────────────────────
  if (urlPath.startsWith("/admin")) {
    return {
      title: "Admin | A2Z BOOKSHOP",
      description: "A2Z BOOKSHOP administration panel.",
      keywords: "",
      ogImage: `${BASE_URL}/logo.jpeg`,
      canonical: `${BASE_URL}${urlPath}`,
      type: "website",
      noindex: true,
      structuredData: {},
    };
  }

  // ── Static routes ────────────────────────────────────────────────────────
  const staticRoutes: Record<string, Omit<PageMeta, "noindex">> = {
    "/about": {
      title: "About Us | A2Z BOOKSHOP",
      description:
        "Learn about A2Z BOOKSHOP, your premier destination for rare, collectible, and contemporary books. Quality guaranteed, fast shipping, and exceptional customer service.",
      keywords:
        "about a2z bookshop, online bookstore India, rare books, collectible books, book seller India",
      ogImage: `${BASE_URL}/logo.jpeg`,
      canonical: `${BASE_URL}/about`,
      type: "website",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "About A2Z BOOKSHOP",
        url: `${BASE_URL}/about`,
        description:
          "A2Z Bookshop — your premier destination for rare, collectible, and contemporary books.",
      },
    },
    "/contact": {
      title: "Contact Us | A2Z BOOKSHOP",
      description:
        "Get in touch with A2Z BOOKSHOP. Contact our customer service team for book inquiries, orders, shipping questions, or general assistance.",
      keywords:
        "contact a2z bookshop, book store contact, customer service, book inquiries",
      ogImage: `${BASE_URL}/logo.jpeg`,
      canonical: `${BASE_URL}/contact`,
      type: "website",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Contact A2Z BOOKSHOP",
        url: `${BASE_URL}/contact`,
      },
    },
    "/faq": {
      title: "Frequently Asked Questions | A2Z BOOKSHOP",
      description:
        "Find answers to common questions about ordering, payment, shipping, returns, and more at A2Z BOOKSHOP.",
      keywords:
        "a2z bookshop faq, online bookstore questions, shipping faq, return policy, payment methods",
      ogImage: `${BASE_URL}/logo.jpeg`,
      canonical: `${BASE_URL}/faq`,
      type: "website",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        name: "FAQ — A2Z BOOKSHOP",
        url: `${BASE_URL}/faq`,
      },
    },
    "/shipping-info": {
      title: "Shipping Information | A2Z BOOKSHOP",
      description:
        "Learn about our shipping options, delivery times, and costs at A2Z BOOKSHOP. Fast and reliable book delivery across India.",
      keywords:
        "a2z bookshop shipping, book delivery India, shipping rates, delivery time, free shipping",
      ogImage: `${BASE_URL}/logo.jpeg`,
      canonical: `${BASE_URL}/shipping-info`,
      type: "website",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Shipping Information — A2Z BOOKSHOP",
        url: `${BASE_URL}/shipping-info`,
      },
    },
    "/return-policy": {
      title: "Return Policy | A2Z BOOKSHOP",
      description:
        "Read our return policy at A2Z BOOKSHOP. Easy returns. Customer satisfaction guaranteed.",
      keywords:
        "a2z bookshop return policy, book return, refund policy, return books online",
      ogImage: `${BASE_URL}/logo.jpeg`,
      canonical: `${BASE_URL}/return-policy`,
      type: "website",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Return Policy — A2Z BOOKSHOP",
        url: `${BASE_URL}/return-policy`,
      },
    },
    "/cancellation-policy": {
      title: "Cancellation Policy | A2Z BOOKSHOP",
      description:
        "Learn about our order cancellation policy at A2Z BOOKSHOP.",
      keywords:
        "a2z bookshop cancellation, cancel order, order cancellation policy",
      ogImage: `${BASE_URL}/logo.jpeg`,
      canonical: `${BASE_URL}/cancellation-policy`,
      type: "website",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Cancellation Policy — A2Z BOOKSHOP",
        url: `${BASE_URL}/cancellation-policy`,
      },
    },
    "/terms-and-conditions": {
      title: "Terms and Conditions | A2Z BOOKSHOP",
      description:
        "Read the terms and conditions for using A2Z BOOKSHOP, your online book store.",
      keywords: "a2z bookshop terms, terms of service, conditions of use",
      ogImage: `${BASE_URL}/logo.jpeg`,
      canonical: `${BASE_URL}/terms-and-conditions`,
      type: "website",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Terms and Conditions — A2Z BOOKSHOP",
        url: `${BASE_URL}/terms-and-conditions`,
      },
    },
    "/privacy-policy": {
      title: "Privacy Policy | A2Z BOOKSHOP",
      description:
        "Read our privacy policy to understand how A2Z BOOKSHOP collects, uses, and protects your personal data.",
      keywords: "a2z bookshop privacy, privacy policy, data protection",
      ogImage: `${BASE_URL}/logo.jpeg`,
      canonical: `${BASE_URL}/privacy-policy`,
      type: "website",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Privacy Policy — A2Z BOOKSHOP",
        url: `${BASE_URL}/privacy-policy`,
      },
    },
    "/gift-items": {
      title: "Gift Books & Sets | A2Z BOOKSHOP",
      description:
        "Browse our curated selection of gift books and box sets at A2Z BOOKSHOP. Perfect gifts for every book lover.",
      keywords:
        "gift books, book gifts, box sets, book sets, gift ideas books India",
      ogImage: `${BASE_URL}/logo.jpeg`,
      canonical: `${BASE_URL}/gift-items`,
      type: "website",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Gift Books — A2Z BOOKSHOP",
        url: `${BASE_URL}/gift-items`,
      },
    },
  };

  if (staticRoutes[urlPath]) {
    return { ...staticRoutes[urlPath], noindex: false };
  }

  // ── Default / unknown routes ─────────────────────────────────────────────
  return resolveDefaultMeta(urlPath);
}

/**
 * Helper function for default meta tags when no specific route matches
 */
function resolveDefaultMeta(urlPath: string): PageMeta {
  return {
    title: "A2Z BOOKSHOP — Your Online Book Store",
    description:
      "Discover thousands of books at A2Z Bookshop. Buy new and used books online with fast shipping. Fiction, non-fiction, bestsellers, and more.",
    keywords:
      "books, online bookstore, buy books, new books, used books, fiction, non-fiction, bestsellers",
    ogImage: `${BASE_URL}/logo.jpeg`,
    canonical: `${BASE_URL}${urlPath}`,
    type: "website",
    noindex: false,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      url: `${BASE_URL}${urlPath}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Inject SSR meta tags into the raw HTML string (the Vite/static index.html).
 * Returns the original HTML unchanged if anything goes wrong.
 */
export async function injectSSRMeta(
  html: string,
  url: string
): Promise<string> {
  // Skip API and static asset paths — they'll never reach this code path but
  // guard defensively.
  if (
    url.startsWith("/api/") ||
    url.startsWith("/uploads/") ||
    url.startsWith("/assets/")
  ) {
    return html;
  }

  try {
    const meta = await resolvePageMeta(url);

    const robotsContent = meta.noindex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

    const schemaArray = Array.isArray(meta.structuredData)
      ? meta.structuredData
      : [meta.structuredData];

    // Only emit non-empty schema objects
    const schemaScripts = schemaArray
      .filter((s) => s && Object.keys(s).length > 0)
      .map(
        (s) =>
          `    <script type="application/ld+json">${JSON.stringify(s)}</script>`
      )
      .join("\n");

    const headBlock = `    <!-- SSR meta start -->
    <title>${et(meta.title)}</title>
    <meta name="title" content="${ea(meta.title)}">
    <meta name="description" content="${ea(meta.description)}">
    ${meta.keywords ? `<meta name="keywords" content="${ea(meta.keywords)}">` : ""}
    ${!meta.noindex ? `<link rel="canonical" href="${ea(meta.canonical)}">` : ""}
    <meta name="robots" content="${ea(robotsContent)}">
    <meta property="og:type" content="${ea(meta.type)}">
    <meta property="og:url" content="${ea(meta.canonical)}">
    <meta property="og:title" content="${ea(meta.title)}">
    <meta property="og:description" content="${ea(meta.description)}">
    <meta property="og:image" content="${ea(meta.ogImage)}">
    <meta property="og:site_name" content="A2Z BOOKSHOP">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${ea(meta.canonical)}">
    <meta property="twitter:title" content="${ea(meta.title)}">
    <meta property="twitter:description" content="${ea(meta.description)}">
    <meta property="twitter:image" content="${ea(meta.ogImage)}">
${schemaScripts}
    <!-- SSR meta end -->`;

    // Remove the static placeholder <title> that ships in index.html
    let result = html.replace(/<title>[^<]*<\/title>/, "");

    // Inject our block just before </head>
    result = result.replace("</head>", `${headBlock}\n  </head>`);

    // Inject pre-rendered content block for crawlers just before </body>
    if (meta.prerenderedHtml) {
      result = result.replace("</body>", `${meta.prerenderedHtml}\n</body>`);
    }

    return result;
  } catch (err) {
    console.error("[ssrMetaInjector] Error while injecting meta:", err);
    return html;
  }
}
