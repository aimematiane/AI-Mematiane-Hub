/**
 * Guess MIME type from filename extension.
 */
export function guessMimeType(filename = '', fallback = 'application/octet-stream') {
	const ext = filename.split('.').pop()?.toLowerCase();
	const map = {
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		webp: 'image/webp',
		gif: 'image/gif',
		svg: 'image/svg+xml',
		pdf: 'application/pdf'
	};
	return map[ext] || fallback;
}

export function isImageFile(mimeType = '', filename = '') {
	if (mimeType?.startsWith('image/')) return true;
	return /\.(svg|jpg|jpeg|png|webp|gif|avif)$/i.test(filename);
}

/**
 * URL suitable for inline <img> display (Supabase public objects).
 */
export function inlineImageUrl(url = '') {
	if (!url) return '';
	// Strip download-disposition hints if present
	return url.split('?')[0];
}
