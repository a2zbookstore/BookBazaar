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
import { extractBookIdFromSlug, generateBookSlug } from "./slugUtils";

const BASE_URL = "https://a2zbookshop.com";

/**
 * Category-specific SEO meta data.
 * Each key is the category ID from the DB.  Title, description & keywords are
 * crafted so that Google surfaces these pages when users search for those
 * topics (e.g. "buy NFPA books online", "DSM-5 books").
 */
const CATEGORY_SEO: Record<number, { title: string; description: string; keywords: string }> = {
  11: {
    title: "NFPA Books — Fire Protection & Electrical Codes | A2Z BOOKSHOP",
    description: "Buy NFPA books online — NFPA 70 (NEC), NFPA 72, NFPA 101 Life Safety Code & more. New & used editions at the best prices with worldwide shipping.",
    keywords: "NFPA books, NFPA 70, National Electrical Code, NEC 2026, NFPA 72, NFPA 101, fire protection books, fire safety codes, buy NFPA online",
  },
  13: {
    title: "DSM Books — Diagnostic & Statistical Manual | A2Z BOOKSHOP",
    description: "Shop DSM books online — DSM-5, DSM-5-TR and related diagnostic manuals. New & used copies at great prices. Fast worldwide delivery.",
    keywords: "DSM books, DSM-5, DSM-5-TR, diagnostic manual, mental health books, psychiatry books, buy DSM online",
  },
  12: {
    title: "Electrical Engineering Books | A2Z BOOKSHOP",
    description: "Browse electrical engineering books — NEC handbooks, wiring guides, power systems & more. New & used at the best prices with worldwide shipping.",
    keywords: "electrical books, electrical engineering, NEC handbook, wiring books, power systems, buy electrical books online",
  },
  18: {
    title: "ICC Books — International Building & Fire Codes | A2Z BOOKSHOP",
    description: "Buy ICC code books online — International Building Code (IBC), International Fire Code (IFC), IRC & more. Best prices, worldwide delivery.",
    keywords: "ICC books, International Building Code, IBC, IFC, IRC, building codes, fire codes, buy ICC books online",
  },
  17: {
    title: "Medical Books — Nursing, Pharmacy & Clinical | A2Z BOOKSHOP",
    description: "Shop medical books online — nursing guides, pharmacy references, clinical manuals & NCLEX prep. New & used at the best prices. Fast worldwide shipping.",
    keywords: "medical books, nursing books, pharmacy books, clinical books, NCLEX prep, buy medical books online",
  },
  20: {
    title: "Business & Management Books | A2Z BOOKSHOP",
    description: "Browse business management books — leadership, marketing, finance, entrepreneurship & MBA textbooks. Best prices, worldwide delivery.",
    keywords: "business books, management books, MBA textbooks, leadership books, marketing books, buy business books online",
  },
  19: {
    title: "Engineering Books — Civil, Mechanical & More | A2Z BOOKSHOP",
    description: "Shop engineering books online — civil, mechanical, structural & FE exam prep. New & used editions at great prices. Worldwide shipping.",
    keywords: "engineering books, civil engineering, mechanical engineering, FE exam prep, structural engineering, buy engineering books",
  },
  1: {
    title: "Fiction Books — Novels, Thrillers & Literary Fiction | A2Z BOOKSHOP",
    description: "Explore fiction books — bestselling novels, thrillers, mystery, sci-fi, fantasy & literary fiction. New & used at the best prices with worldwide shipping.",
    keywords: "fiction books, novels, thrillers, mystery books, sci-fi, fantasy, literary fiction, buy fiction online",
  },
  2: {
    title: "Non-Fiction Books — Biographies, Self-Help & More | A2Z BOOKSHOP",
    description: "Browse non-fiction books — biographies, memoirs, self-help, psychology, politics & history. Best prices, worldwide delivery.",
    keywords: "non-fiction books, biographies, self-help books, psychology books, memoirs, buy non-fiction online",
  },
  4: {
    title: "History Books — World History & Civilizations | A2Z BOOKSHOP",
    description: "Shop history books — world history, ancient civilizations, wars, biographies & political history. New & used at great prices.",
    keywords: "history books, world history, ancient history, war books, political history, buy history books online",
  },
  3: {
    title: "Science Books — Physics, Biology & Chemistry | A2Z BOOKSHOP",
    description: "Browse science books — physics, biology, chemistry, earth science & popular science. New & used editions with worldwide shipping.",
    keywords: "science books, physics books, biology books, chemistry books, popular science, buy science books online",
  },
  5: {
    title: "Technology Books — Programming, IT & Cybersecurity | A2Z BOOKSHOP",
    description: "Shop technology books — programming, Python, data science, IT networking, cybersecurity & more. Best prices with worldwide delivery.",
    keywords: "technology books, programming books, Python books, data science, IT books, cybersecurity, buy tech books online",
  },
  8: {
    title: "Romance Books — Contemporary & Classic Romance | A2Z BOOKSHOP",
    description: "Explore romance books — contemporary, historical, romantic suspense & classic romance novels. New & used at great prices.",
    keywords: "romance books, romance novels, contemporary romance, historical romance, buy romance books online",
  },
  23: {
    title: "Novels & Comic Books — Graphic Novels & Manga | A2Z BOOKSHOP",
    description: "Browse novels, comic books, graphic novels & manga. New & used editions at the best prices with worldwide shipping.",
    keywords: "novels, comic books, graphic novels, manga, buy comics online, buy novels online",
  },
  22: {
    title: "Social Science Books — Sociology, Psychology & Education | A2Z BOOKSHOP",
    description: "Shop social science books — sociology, psychology, education, diversity & social justice. New & used at great prices.",
    keywords: "social science books, sociology books, psychology, education books, diversity, buy social science books online",
  },
};

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
          `    <li><a href="${BASE_URL}/books/${generateBookSlug(b.title, b.id)}">${et(b.title)} by ${
            et(b.author)
          } — ${et(b.condition)} — &#8377;${et(String(b.price))}</a></li>`
      )
      .join("\n");

    const html =
      `<section id="ssr-catalog" style="position:absolute;width:1px;height:1px;` +
      `overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">\n` +
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
            `    <li><a href="${BASE_URL}/books/${generateBookSlug(b.title, b.id)}">${et(b.title)} by ${
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
      `overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">\n` +
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
          : `Buy "${book.title}" by ${book.author} at A2Z Bookshop. ${book.condition} condition. Worldwide shipping with secure payment.`;

        const title = `${book.title} by ${book.author} | A2Z BOOKSHOP`;
        const imageUrl =
          book.imageUrl?.startsWith("http")
            ? book.imageUrl
            : `${BASE_URL}${book.imageUrl || "/logo.jpeg"}`;
        const bookSlug = generateBookSlug(book.title, book.id);
        const canonical = `${BASE_URL}/books/${bookSlug}`;

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
        const prerenderedHtml = `<div id="ssr-book-content" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">
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
      title: "A2Z BOOKSHOP — Buy Books Online | New & Used Books | Worldwide Shipping",
      description:
        "A2Z Bookshop (a2zbookshop.com) — Your trusted online bookstore for new & used books. Browse 1000s of titles across fiction, non-fiction, children's, academic & more. Filter by genre, condition or price. Secure checkout via PayPal, Stripe & Razorpay. Worldwide shipping.",
      keywords:
        "a2z, a2z bookshop, a2zbookshop, a2z book shop, a2z books, a to z bookshop, a-to-z bookshop, a2z book store, a2zbookshop.com, buy books online, online bookstore, new books, used books, fiction, non-fiction, bestsellers, trending books, book store worldwide",
      ogImage: `${BASE_URL}/logo.jpeg`,
      canonical: BASE_URL,
      type: "website",
      noindex: false,
      structuredData: [
        // WebSite schema with SearchAction (triggers Google sitelinks search box)
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "A2Z BOOKSHOP",
          alternateName: [
            "A2Z Bookshop",
            "A2Z Book Shop",
            "a2zbookshop",
            "a2z bookshop",
            "a2z books",
            "a2z book store",
            "A to Z Bookshop",
            "a-to-z bookshop",
            "a2zbookshop.com",
          ],
          url: BASE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${BASE_URL}/catalog?search={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        },
        // Organization schema for Knowledge Panel & logo display
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "A2Z BOOKSHOP",
          alternateName: [
            "A2Z Bookshop",
            "A2Z Book Shop",
            "a2zbookshop",
            "a2z bookshop",
            "a2z books",
            "a2z book store",
            "A to Z Bookshop",
            "a-to-z bookshop",
            "a2zbookshop.com",
          ],
          url: BASE_URL,
          logo: `${BASE_URL}/logo.jpeg`,
          image: [
            `${BASE_URL}/logo.jpeg`,
            `${BASE_URL}/favicon.png`,
          ],
          description: "A2Z Bookshop — Your trusted online bookstore for new & used books. Browse 1000s of titles across fiction, non-fiction, children's, academic & more. Secure checkout & worldwide shipping.",
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer Service",
            email: "support@a2zbookshop.com",
            availableLanguage: ["English", "Hindi"],
          },
          sameAs: [
            "https://www.instagram.com/a2zbookshop",
            "https://www.facebook.com/a2zbookshop",
          ],
        },
        // SiteNavigationElement — tells Google about the main navigation links
        // This is the key schema that helps Google generate sitelinks
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Main Navigation",
          itemListElement: [
            {
              "@type": "SiteNavigationElement",
              position: 1,
              name: "Book Catalog",
              description: "Browse our complete collection of new & used books across all categories",
              url: `${BASE_URL}/catalog`,
            },
            {
              "@type": "SiteNavigationElement",
              position: 2,
              name: "NFPA Books",
              description: "Buy NFPA books — NEC, NFPA 72, NFPA 101 Life Safety Code & fire protection codes",
              url: `${BASE_URL}/catalog?categoryId=11`,
            },
            {
              "@type": "SiteNavigationElement",
              position: 3,
              name: "DSM Books",
              description: "Shop DSM-5, DSM-5-TR and diagnostic manuals for mental health professionals",
              url: `${BASE_URL}/catalog?categoryId=13`,
            },
            {
              "@type": "SiteNavigationElement",
              position: 4,
              name: "Medical Books",
              description: "Nursing, pharmacy, clinical manuals & NCLEX prep at the best prices",
              url: `${BASE_URL}/catalog?categoryId=17`,
            },
            {
              "@type": "SiteNavigationElement",
              position: 5,
              name: "ICC Books",
              description: "International Building Code, Fire Code & construction code books",
              url: `${BASE_URL}/catalog?categoryId=18`,
            },
            {
              "@type": "SiteNavigationElement",
              position: 6,
              name: "Engineering Books",
              description: "Civil, mechanical, structural engineering & FE exam prep books",
              url: `${BASE_URL}/catalog?categoryId=19`,
            },
            {
              "@type": "SiteNavigationElement",
              position: 7,
              name: "Bestsellers",
              description: "Shop our bestselling books — top reads from around the world",
              url: `${BASE_URL}/catalog?bestseller=true`,
            },
            {
              "@type": "SiteNavigationElement",
              position: 8,
              name: "New Arrivals",
              description: "Explore our latest book arrivals — fresh stock added regularly",
              url: `${BASE_URL}/catalog?newArrival=true`,
            },
            {
              "@type": "SiteNavigationElement",
              position: 9,
              name: "Electrical Books",
              description: "NEC handbooks, wiring guides, power systems & electrical engineering",
              url: `${BASE_URL}/catalog?categoryId=12`,
            },
            {
              "@type": "SiteNavigationElement",
              position: 10,
              name: "Technology Books",
              description: "Programming, Python, data science, IT & cybersecurity books",
              url: `${BASE_URL}/catalog?categoryId=5`,
            },
            {
              "@type": "SiteNavigationElement",
              position: 11,
              name: "Gift Books & Sets",
              description: "Curated gift books and box sets — perfect for every book lover",
              url: `${BASE_URL}/gift-items`,
            },
            {
              "@type": "SiteNavigationElement",
              position: 12,
              name: "Contact Us",
              description: "Get in touch with A2Z BOOKSHOP for inquiries or support",
              url: `${BASE_URL}/contact`,
            },
          ],
        },
      ],
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
      "Browse thousands of books across all categories — fiction, non-fiction, bestsellers, children's & academic. Best prices with worldwide shipping.";
    const metaKeywordsDefault =
      "buy books online, book catalog, fiction books, non-fiction books, bestsellers, international online bookstore, book store worldwide";
    let metaKeywords = metaKeywordsDefault;
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
      metaDesc = "Shop our bestselling books at A2Z Bookshop. Top reads from around the world, delivered worldwide.";
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
      // Look up category-specific SEO data
      const catSeo = CATEGORY_SEO[categoryId];
      if (catSeo) {
        metaTitle = catSeo.title;
        metaDesc = catSeo.description;
        metaKeywords = catSeo.keywords;
        heading = catSeo.title.split(" | ")[0]; // Use title before pipe as heading
      } else {
        // Fallback: try to fetch category name from DB
        try {
          const allCats = await storage.getCategories();
          const cat = allCats.find((c: any) => c.id === categoryId);
          if (cat) {
            heading = `${cat.name} — Books`;
            metaTitle = `${cat.name} Books | A2Z BOOKSHOP`;
            metaDesc = `Browse ${cat.name} books at A2Z Bookshop. Best prices with worldwide shipping.`;
          }
        } catch {}
      }
    }

    const { html: prerenderedHtml, total } = await buildCatalogPrerender(
      heading,
      { search, categoryId, featured, bestseller, trending, newArrival, boxSet },
      30
    );

    if (total > 0 && !search && !categoryId && !featured && !bestseller && !trending && !newArrival && !boxSet) {
      metaDesc = `Browse ${total}+ books at A2Z Bookshop — fiction, non-fiction, bestsellers & more. Secure checkout, worldwide shipping.`;
    } else if (total > 0 && categoryId) {
      // Append book count to category description
      const catSeo = CATEGORY_SEO[categoryId];
      if (!catSeo) {
        metaDesc = `Browse ${total}+ books in this category at A2Z Bookshop. Best prices, worldwide shipping.`;
      }
    }

    // Build breadcrumb — add category name as 3rd level when on a category page
    const breadcrumbItems: object[] = [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Catalog", item: `${BASE_URL}/catalog` },
    ];
    if (categoryId) {
      const catTitle = heading.split(" — ")[0] || heading;
      breadcrumbItems.push({
        "@type": "ListItem", position: 3, name: catTitle, item: canonical,
      });
    }

    return {
      title: metaTitle,
      description: metaDesc,
      keywords: metaKeywords,
      ogImage: `${BASE_URL}/favicon.png`,
      canonical,
      type: "website",
      noindex: false,
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: heading,
          description: metaDesc,
          url: canonical,
          provider: { "@type": "Organization", name: "A2Z BOOKSHOP" },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbItems,
        },
      ],
      prerenderedHtml: prerenderedHtml || undefined,
    };
  }

  // ── Admin pages — noindex ────────────────────────────────────────────────
  if (urlPath.startsWith("/admin")) {
    return {
      title: "Admin | A2Z BOOKSHOP",
      description: "A2Z BOOKSHOP administration panel.",
      keywords: "",
      ogImage: `${BASE_URL}/favicon.png`,
      canonical: `${BASE_URL}${urlPath}`,
      type: "website",
      noindex: true,
      structuredData: {},
    };
  }

  // ── Private/user pages — noindex ─────────────────────────────────────────
  const noindexPaths = [
    "/checkout", "/my-orders", "/wishlist", "/cart", "/profile",
    "/login", "/register", "/reset-password", "/paypal-complete",
  ];
  if (noindexPaths.some((p) => urlPath === p || urlPath.startsWith(p + "/"))) {
    return {
      title: "A2Z BOOKSHOP — Your Online Book Store",
      description: "A2Z Bookshop — your global online bookstore for new & used books.",
      keywords: "",
      ogImage: `${BASE_URL}/favicon.png`,
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
        "about a2z bookshop, a2zbookshop, a2z books, a2z book shop, international online bookstore, rare books, collectible books, global book seller",
      ogImage: `${BASE_URL}/favicon.png`,
      canonical: `${BASE_URL}/about`,
      type: "website",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About A2Z BOOKSHOP",
          url: `${BASE_URL}/about`,
          description:
            "A2Z Bookshop — your premier destination for rare, collectible, and contemporary books.",
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: "About Us", item: `${BASE_URL}/about` },
          ],
        },
      ],
    },
    "/contact": {
      title: "Contact Us | A2Z BOOKSHOP",
      description:
        "Get in touch with A2Z BOOKSHOP. Contact our customer service team for book inquiries, orders, shipping questions, or general assistance.",
      keywords:
        "contact a2z bookshop, a2zbookshop, a2z book shop, book store contact, customer service, book inquiries",
      ogImage: `${BASE_URL}/favicon.png`,
      canonical: `${BASE_URL}/contact`,
      type: "website",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact A2Z BOOKSHOP",
          url: `${BASE_URL}/contact`,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: "Contact Us", item: `${BASE_URL}/contact` },
          ],
        },
      ],
    },
    "/faq": {
      title: "Frequently Asked Questions | A2Z BOOKSHOP",
      description:
        "Find answers to common questions about ordering, payment, shipping, returns, and more at A2Z BOOKSHOP.",
      keywords:
        "a2z bookshop faq, a2zbookshop faq, online bookstore questions, shipping faq, return policy, payment methods",
      ogImage: `${BASE_URL}/favicon.png`,
      canonical: `${BASE_URL}/faq`,
      type: "website",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          name: "FAQ — A2Z BOOKSHOP",
          url: `${BASE_URL}/faq`,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: "FAQ", item: `${BASE_URL}/faq` },
          ],
        },
      ],
    },
    "/shipping-info": {
      title: "Shipping Information | A2Z BOOKSHOP",
      description:
        "Learn about our shipping options, delivery times, and costs at A2Z BOOKSHOP. Fast and reliable book delivery worldwide.",
      keywords:
        "a2z bookshop shipping, a2zbookshop shipping, international book delivery, worldwide shipping rates, delivery time, free shipping",
      ogImage: `${BASE_URL}/favicon.png`,
      canonical: `${BASE_URL}/shipping-info`,
      type: "website",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Shipping Information — A2Z BOOKSHOP",
          url: `${BASE_URL}/shipping-info`,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: "Shipping Info", item: `${BASE_URL}/shipping-info` },
          ],
        },
      ],
    },
    "/return-policy": {
      title: "Return Policy | A2Z BOOKSHOP",
      description:
        "Read our return policy at A2Z BOOKSHOP. Easy returns. Customer satisfaction guaranteed.",
      keywords:
        "a2z bookshop return policy, a2zbookshop returns, book return, refund policy, return books online",
      ogImage: `${BASE_URL}/favicon.png`,
      canonical: `${BASE_URL}/return-policy`,
      type: "website",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Return Policy — A2Z BOOKSHOP",
          url: `${BASE_URL}/return-policy`,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: "Return Policy", item: `${BASE_URL}/return-policy` },
          ],
        },
      ],
    },
    "/cancellation-policy": {
      title: "Cancellation Policy | A2Z BOOKSHOP",
      description:
        "Learn about our order cancellation policy at A2Z BOOKSHOP.",
      keywords:
        "a2z bookshop cancellation, a2zbookshop cancel order, cancel order, order cancellation policy",
      ogImage: `${BASE_URL}/favicon.png`,
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
      keywords: "a2z bookshop terms, a2zbookshop terms, terms of service, conditions of use",
      ogImage: `${BASE_URL}/favicon.png`,
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
      keywords: "a2z bookshop privacy, a2zbookshop privacy, privacy policy, data protection",
      ogImage: `${BASE_URL}/favicon.png`,
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
        "gift books, book gifts, box sets, book sets, gift ideas for book lovers worldwide, a2z bookshop, a2zbookshop",
      ogImage: `${BASE_URL}/favicon.png`,
      canonical: `${BASE_URL}/gift-items`,
      type: "website",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Gift Books — A2Z BOOKSHOP",
          url: `${BASE_URL}/gift-items`,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: "Gift Books & Sets", item: `${BASE_URL}/gift-items` },
          ],
        },
      ],
    },
    "/track-order": {
      title: "Track Your Order | A2Z BOOKSHOP",
      description:
        "Track the delivery status of your book order at A2Z BOOKSHOP. Enter your order number to get real-time updates.",
      keywords:
        "track order, order tracking, delivery status, a2z bookshop order, a2zbookshop",
      ogImage: `${BASE_URL}/favicon.png`,
      canonical: `${BASE_URL}/track-order`,
      type: "website",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Track Your Order — A2Z BOOKSHOP",
          url: `${BASE_URL}/track-order`,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: "Track Order", item: `${BASE_URL}/track-order` },
          ],
        },
      ],
    },
    "/request-book": {
      title: "Request a Book | A2Z BOOKSHOP",
      description:
        "Can't find the book you're looking for? Request it at A2Z BOOKSHOP and we'll source it for you. Any title, any author.",
      keywords:
        "request book, book request, find a book, source books, a2z bookshop, a2zbookshop",
      ogImage: `${BASE_URL}/favicon.png`,
      canonical: `${BASE_URL}/request-book`,
      type: "website",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Request a Book — A2Z BOOKSHOP",
          url: `${BASE_URL}/request-book`,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: "Request a Book", item: `${BASE_URL}/request-book` },
          ],
        },
      ],
    },
    "/returns": {
      title: "Returns & Refunds | A2Z BOOKSHOP",
      description:
        "Initiate a return or check your refund status at A2Z BOOKSHOP. Hassle-free returns with customer satisfaction guaranteed.",
      keywords:
        "returns, refunds, book return, return request, a2z bookshop returns, a2zbookshop",
      ogImage: `${BASE_URL}/favicon.png`,
      canonical: `${BASE_URL}/returns`,
      type: "website",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Returns & Refunds — A2Z BOOKSHOP",
          url: `${BASE_URL}/returns`,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: "Returns", item: `${BASE_URL}/returns` },
          ],
        },
      ],
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
    title: "A2Z BOOKSHOP — Buy Books Online | New & Used Books | Worldwide Shipping",
    description:
      "A2Z Bookshop (a2zbookshop.com) — Your trusted online bookstore for new & used books. Browse 1000s of titles — fiction, non-fiction, children's, academic & more. Filter by genre, condition or price. Secure checkout via PayPal, Stripe & Razorpay. Worldwide shipping.",
    keywords:
      "a2z, a2z bookshop, a2zbookshop, a2z book shop, a2z books, books, online bookstore, buy books worldwide, new books, used books, fiction, non-fiction, bestsellers",
    ogImage: `${BASE_URL}/favicon.png`,
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
    <meta charset="UTF-8" />
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

    // Remove the static placeholder <title>, description, and robots tags that ship in index.html
    // to avoid duplicates with the SSR-injected block below.
    let result = html.replace(/<title>[^<]*<\/title>/, "");
    result = result.replace(/<meta name="description"[^>]*>/i, "");
    result = result.replace(/<meta name="robots"[^>]*>/i, "");
    // Remove the static Organization JSON-LD from index.html — SSR injects per-route schemas
    result = result.replace(/<script type="application\/ld\+json" id="static-org-schema">[\s\S]*?<\/script>/i, "");

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
