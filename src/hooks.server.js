const securityHeaders = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
	'X-XSS-Protection': '0'
};

const cspDirectives = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
	"style-src 'self' 'unsafe-inline'",
	"font-src 'self'",
	"img-src 'self' data: blob: https://aocnsmmsddvnmrbnneds.supabase.co",
	"connect-src 'self' https://aocnsmmsddvnmrbnneds.supabase.co https://*.supabase.co",
	"frame-ancestors 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	"object-src 'none'"
];

const cspHeader = cspDirectives.join('; ');

export function handle({ event, resolve }) {
	return resolve(event).then((response) => {
		const isHtml = response.headers.get('content-type')?.startsWith('text/html');
		if (isHtml) {
			for (const [key, value] of Object.entries(securityHeaders)) {
				response.headers.set(key, value);
			}
			response.headers.set('Content-Security-Policy', cspHeader);
		}
		return response;
	});
}
