/** Canonical site URL — set VITE_SITE_URL in production/staging. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://ai-mematiane.com').replace(/\/$/, '');

export function absoluteUrl(path = '/') {
	if (!path) return SITE_URL;
	if (path.startsWith('http')) return path;
	return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function cleanMetaText(value = '') {
	return String(value).replace(/\s+/g, ' ').trim();
}

export function truncateMetaText(value = '', maxLength = 160) {
	const cleaned = cleanMetaText(value);
	if (cleaned.length <= maxLength) return cleaned;
	const truncated = cleaned.slice(0, maxLength - 1).trimEnd();
	const lastSpace = truncated.lastIndexOf(' ');
	return `${truncated.slice(0, lastSpace > 80 ? lastSpace : truncated.length).trimEnd()}…`;
}

export function resolveMetaTitle(metaTitle, fallback) {
	const trimmed = cleanMetaText(metaTitle);
	return truncateMetaText(trimmed || fallback, 60);
}

export function resolveMetaDescription(metaDescription, fallback) {
	const trimmed = cleanMetaText(metaDescription);
	return truncateMetaText(trimmed || fallback, 160);
}
