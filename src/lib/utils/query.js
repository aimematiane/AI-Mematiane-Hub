/**
 * Validation and sanitization helpers for URL query parameters.
 * Centralizes bounds-checking and input sanitization to prevent
 * malformed pagination, ReDoS-style ilike injection, and invalid filters.
 */

/** Allowed content categories. Anything else is treated as "no filter". */
export const ALLOWED_CATEGORIES = ['text', 'image', 'video', 'audio', 'code', 'data', 'general', 'other'];

/** Allowed pricing filters for AI tools. */
export const ALLOWED_PRICING = ['free', 'freemium', 'paid', 'open_source'];

/** Allowed sort options for AI tools. */
export const ALLOWED_SORTS = ['featured', 'newest', 'oldest', 'name_asc', 'name_desc'];

/**
 * Parse a page param into a safe integer within [1, max].
 * @param {string|null} raw
 * @param {number} max - upper bound to avoid absurd offsets
 * @returns {number}
 */
export function parsePage(raw, max = 10000) {
	const n = parseInt(raw ?? '', 10);
	if (!Number.isFinite(n) || n < 1) return 1;
	return Math.min(n, max);
}

/**
 * Sanitize a free-text search term for safe use in a Postgres ilike pattern.
 * Escapes the LIKE wildcards (% and _) and the escape char (\) so users
 * cannot inject patterns that match everything or cause expensive scans.
 * @param {string|null} raw
 * @param {number} maxLength
 * @returns {string} sanitized term (empty string if none)
 */
export function sanitizeSearch(raw, maxLength = 100) {
	if (!raw) return '';
	return raw
		.slice(0, maxLength)
		.trim()
		.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/**
 * Validate a value against an allowlist, returning '' when invalid.
 * @param {string|null} raw
 * @param {string[]} allowed
 * @returns {string}
 */
export function allowFrom(raw, allowed) {
	return raw && allowed.includes(raw) ? raw : '';
}
