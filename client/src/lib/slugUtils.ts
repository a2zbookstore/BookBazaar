/**
 * Generate a URL-friendly slug from a book title and ID.
 * The trailing numeric ID is the actual identifier used for API calls.
 *
 * Examples:
 *   ("The Great Gatsby", 42)  → "the-great-gatsby-42"
 *   ("Harry Potter & the Philosopher's Stone", 7) → "harry-potter-the-philosophers-stone-7"
 */
export function generateBookSlug(title: string, id: number): string {
  const slug = title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/['']/g, "")                              // remove apostrophes
    .replace(/[^a-z0-9]+/g, "-")                       // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, "")                           // trim leading/trailing hyphens
    .replace(/-{2,}/g, "-");                            // collapse multiple hyphens
  return `${slug}-${id}`;
}

/**
 * Extract the numeric book ID from a slug or plain numeric string.
 *
 * Supported formats:
 *   "42"                → 42
 *   "the-great-gatsby-42" → 42
 */
export function extractBookIdFromSlug(slugOrId: string): number | null {
  if (/^\d+$/.test(slugOrId)) return parseInt(slugOrId, 10);
  const match = slugOrId.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}
