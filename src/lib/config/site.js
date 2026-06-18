/** Canonical site URL — set VITE_SITE_URL in production/staging. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://ai-mematiane.com').replace(/\/$/, '');

export function absoluteUrl(path = '/') {
	if (!path) return SITE_URL;
	if (path.startsWith('http')) return path;
	return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function resolveMetaTitle(metaTitle, fallback) {
	const trimmed = metaTitle?.trim();
	return trimmed || fallback;
}

export function resolveMetaDescription(metaDescription, fallback) {
	const trimmed = metaDescription?.trim();
	return trimmed || fallback;
}
