/**
 * Optimizes a Supabase Storage public URL by converting it to use the Image Transformations API.
 * This compresses images on-the-fly and converts them to WebP format.
 * 
 * @param {string} url - The raw public image URL
 * @param {Object} options - Transformation options
 * @param {number} options.width - Max width of the image
 * @param {number} options.quality - Quality (1-100)
 * @param {string} options.format - Output format (e.g., 'webp')
 * @returns {string} The optimized image URL or original URL if it's not a Supabase storage URL
 */
export function optimizeImageUrl(url, { width = 800, quality = 80, format = 'webp' } = {}) {
	if (!url) return '';

	// Check if this is a standard Supabase public storage URL
	if (url.includes('/storage/v1/object/public/')) {
		// Replace /object/ with /render/image/
		let optimizedUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
		
		// Append transformation query parameters
		const params = new URLSearchParams();
		if (width) params.append('width', width.toString());
		if (quality) params.append('quality', quality.toString());
		if (format) params.append('format', format);

		// If the original URL already had query parameters (unlikely but possible), preserve them
		const separator = optimizedUrl.includes('?') ? '&' : '?';
		return `${optimizedUrl}${separator}${params.toString()}`;
	}

	return url;
}
