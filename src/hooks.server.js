import { SITE_URL } from '$lib/config/site.js';

const securityHeaders = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
	'X-XSS-Protection': '0',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

function buildCspHeader() {
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
	let supabaseHost = '';
	try {
		if (supabaseUrl) supabaseHost = new URL(supabaseUrl).host;
	} catch {
		// ignore invalid URL
	}

	const imgSrc = ["'self'", 'data:', 'blob:'];
	if (supabaseHost) imgSrc.push(`https://${supabaseHost}`);

	const connectSrc = ["'self'", 'https://vitals.vercel-insights.com', 'https://va.vercel-scripts.com'];
	if (supabaseHost) {
		connectSrc.push(`https://${supabaseHost}`, 'https://*.supabase.co');
	}

	const directives = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
		"style-src 'self' 'unsafe-inline'",
		"font-src 'self'",
		`img-src ${imgSrc.join(' ')}`,
		`connect-src ${connectSrc.join(' ')}`,
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"object-src 'none'",
		"upgrade-insecure-requests"
	];

	return directives.join('; ');
}

const cspHeader = buildCspHeader();

export function handle({ event, resolve }) {
	return resolve(event).then((response) => {
		const isHtml = response.headers.get('content-type')?.startsWith('text/html');
		if (isHtml) {
			for (const [key, value] of Object.entries(securityHeaders)) {
				response.headers.set(key, value);
			}
			response.headers.set('Content-Security-Policy', cspHeader);
			response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
			response.headers.set('Pragma', 'no-cache');
			response.headers.set('Expires', '0');
		}
		return response;
	});
}
