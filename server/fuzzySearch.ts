/**
 * Fuzzy search utilities for handling typos and misspellings
 */

/**
 * Calculate Levenshtein distance between two strings
 * This measures the minimum number of single-character edits needed to change one word into another
 */
export function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create a 2D array for dynamic programming
    const dp: number[][] = Array(len1 + 1)
        .fill(null)
        .map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) dp[i][0] = i;
    for (let j = 0; j <= len2; j++) dp[0][j] = j;

    // Fill the dp table
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,     // deletion
                    dp[i][j - 1] + 1,     // insertion
                    dp[i - 1][j - 1] + 1  // substitution
                );
            }
        }
    }

    return dp[len1][len2];
}

/**
 * Calculate similarity score between two strings (0 to 1, where 1 is identical)
 */
export function similarityScore(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;

    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return 1 - distance / maxLen;
}

/**
 * Check if a fuzzy match exists between search term and target text
 * @param searchTerm - User's search query
 * @param targetText - Text to search in (book title, author, etc.)
 * @param threshold - Minimum similarity score (0 to 1). Default 0.7 means 70% similar
 * @param requireAllWords - If false, allows partial word matches (default: false for more lenient search)
 * @returns true if fuzzy match found
 */
export function fuzzyMatch(
    searchTerm: string,
    targetText: string,
    threshold: number = 0.7,
    requireAllWords: boolean = false
): boolean {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const normalizedTarget = targetText.toLowerCase();

    // Exact match - highest priority
    if (normalizedTarget.includes(normalizedSearch)) {
        return true;
    }

    // Split into words - also split on hyphens and other punctuation for better matching
    const searchWords = normalizedSearch.split(/[\s\-:,;.]+/).filter(w => w.length > 0);
    const targetWords = normalizedTarget.split(/[\s\-:,;.]+/).filter(w => w.length > 0);

    if (searchWords.length === 0) return false;

    let matchedWords = 0;
    const significantWords: string[] = []; // Words longer than 2 chars are significant

    // Check each search word for fuzzy match in target words
    for (const searchWord of searchWords) {
        if (searchWord.length >= 3) {
            significantWords.push(searchWord);
        }

        let wordMatched = false;

        if (searchWord.length < 3) {
            // For very short words (numbers, etc), check if it appears anywhere in target
            const hasMatch = targetWords.some(targetWord =>
                targetWord.includes(searchWord) || targetWord === searchWord
            ) || normalizedTarget.includes(searchWord);
            if (hasMatch) {
                wordMatched = true;
                matchedWords++;
            }
        } else {
            // Check fuzzy match for longer words
            const hasFuzzyMatch = targetWords.some(targetWord => {
                // Skip very short target words for matching significant search words
                if (targetWord.length < 2 && searchWord.length >= 3) return false;

                // If the word is much longer/shorter, be more lenient with threshold
                const lengthDiff = Math.abs(searchWord.length - targetWord.length);
                const adjustedThreshold = lengthDiff > 3 ? threshold - 0.15 : threshold;

                return similarityScore(searchWord, targetWord) >= adjustedThreshold;
            });

            if (hasFuzzyMatch) {
                wordMatched = true;
                matchedWords++;
            }
        }
    }

    // If requireAllWords is true, all words must match (original strict behavior)
    if (requireAllWords) {
        return matchedWords === searchWords.length;
    }

    // Otherwise, use a more lenient approach:
    // - If there are significant words (3+ chars), at least one must match
    // - At least 40% of words should match OR at least 1 word matches (for 2-word searches)
    const hasSignificantMatch = significantWords.length === 0 ||
        significantWords.some(sw =>
            targetWords.some(tw => {
                // More lenient for significant word matching
                return similarityScore(sw, tw) >= Math.max(threshold - 0.2, 0.5);
            })
        );

    const matchRatio = matchedWords / searchWords.length;

    // Be more lenient: if at least one significant word matches, consider it a match
    return hasSignificantMatch && (matchRatio >= 0.4 || (matchedWords >= 1 && searchWords.length <= 3));
}

/**
 * Get fuzzy match score for ranking search results
 * Higher score = better match
 */
export function getFuzzyMatchScore(searchTerm: string, targetText: string): number {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const normalizedTarget = targetText.toLowerCase();

    // Exact substring match gets highest score
    if (normalizedTarget.includes(normalizedSearch)) {
        return 100;
    }

    // Check if starts with search term (high priority)
    if (normalizedTarget.startsWith(normalizedSearch)) {
        return 95;
    }

    // Calculate word-by-word similarity - split on spaces, hyphens, and punctuation
    const searchWords = normalizedSearch.split(/[\s\-:,;.]+/).filter(w => w.length > 0);
    const targetWords = normalizedTarget.split(/[\s\-:,;.]+/).filter(w => w.length > 0);

    if (searchWords.length === 0) return 0;

    let totalScore = 0;
    let matchedWords = 0;
    let significantWordMatches = 0;

    for (const searchWord of searchWords) {
        let bestWordScore = 0;
        const isSignificant = searchWord.length >= 3;

        for (const targetWord of targetWords) {
            const score = similarityScore(searchWord, targetWord);
            bestWordScore = Math.max(bestWordScore, score);
        }

        // Also check if the word appears anywhere in the full target text
        if (bestWordScore < 0.5 && normalizedTarget.includes(searchWord)) {
            bestWordScore = 0.7; // Give some credit for substring matches
        }

        if (bestWordScore > 0.5) { // Lower threshold to 0.5 for more lenient matching
            totalScore += bestWordScore;
            matchedWords++;

            if (isSignificant && bestWordScore > 0.6) {
                significantWordMatches++;
            }
        }
    }

    // Return score based on matches
    if (matchedWords === 0) return 0;

    // Calculate base score from average similarity of matched words
    const avgMatchScore = totalScore / matchedWords;

    // Calculate match ratio
    const matchRatio = matchedWords / searchWords.length;

    // Boost score if significant words (3+ chars) matched well
    const significantWordCount = searchWords.filter(w => w.length >= 3).length;
    const significantMatchRatio = significantWordCount > 0
        ? significantWordMatches / significantWordCount
        : matchRatio;

    // If key words matched, give higher score even if not all words matched
    // This helps with searches like "dsm 12" matching "DSM-5" (DSM matches strongly)
    const effectiveRatio = Math.max(matchRatio * 0.6, significantMatchRatio * 0.8);

    return avgMatchScore * effectiveRatio * 90; // Scale to 0-90 range
}

/**
 * Normalize text for search (remove special characters, lowercase)
 */
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters but keep spaces
        .trim();
}

/**
 * Find the best fuzzy matches from a list of options
 */
export function findBestFuzzyMatches(
    searchTerm: string,
    options: string[],
    maxResults: number = 10,
    threshold: number = 0.65
): string[] {
    const scoredOptions = options
        .map(option => ({
            text: option,
            score: getFuzzyMatchScore(searchTerm, option)
        }))
        .filter(item => item.score > threshold * 100)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

    return scoredOptions.map(item => item.text);
}
