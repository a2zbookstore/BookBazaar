/**
 * Utility to extract a numeric book ID from a URL slug or plain ID.
 *
 * Supported formats:
 *   "42"                    → 42   (plain numeric ID)
 *   "book-title-42"         → 42   (slug ending with -<id>)
 *
 * Returns null when the input doesn't match any known pattern.
 */
export function extractBookIdFromSlug(slugOrId: string): number | null {
  // Pure numeric ID
  if (/^\d+$/.test(slugOrId)) {
    return parseInt(slugOrId, 10);
  }

  // Slug pattern: some-text-<id>
  const match = slugOrId.match(/-(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return null;
}
