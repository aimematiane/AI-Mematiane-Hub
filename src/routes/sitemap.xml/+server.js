import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { SITE_URL } from '$lib/config/site.js';

function escapeXml(value = '') {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function formatLastmod(value) {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	return date.toISOString().split('T')[0];
}

export async function GET(event) {
	const client = await getSupabaseServerClient(event);
	const siteUrl = SITE_URL;

	const [
		{ data: posts, count: postCount },
		{ data: news, count: newsCount },
		{ data: tools },
		{ data: pages }
	] = await Promise.all([
		client.from('posts').select('slug, updated_at', { count: 'exact' }).eq('is_published', true),
		client.from('news').select('slug, updated_at', { count: 'exact' }).eq('is_published', true),
		client.from('ai_tools').select('slug, updated_at'),
		client.from('pages').select('slug, updated_at').eq('is_published', true).is('deleted_at', null)
	]);

	const staticPages = ['/', '/ai-tools', '/blog', '/news'];
	const postsPerPage = 6;
	const newsPerPage = 9;
	const newsCategories = ['research', 'industry', 'policy', 'product', 'general'];
	const toolCategories = ['text', 'image', 'video', 'audio', 'code', 'data', 'other'];

	const urls = [
		...staticPages.map(p => ({ loc: `${siteUrl}${p}`, changefreq: 'daily', priority: '0.9' })),

		...Array.from({ length: Math.ceil((postCount || 0) / postsPerPage) }, (_, i) => i + 2)
			.map(pg => ({ loc: `${siteUrl}/blog?page=${pg}`, changefreq: 'daily', priority: '0.6' })),

		...Array.from({ length: Math.ceil((newsCount || 0) / newsPerPage) }, (_, i) => i + 2)
			.map(pg => ({ loc: `${siteUrl}/news?page=${pg}`, changefreq: 'daily', priority: '0.6' })),

		...newsCategories.map(cat => ({ loc: `${siteUrl}/news?category=${cat}`, changefreq: 'daily', priority: '0.7' })),

		...toolCategories.map(cat => ({ loc: `${siteUrl}/ai-tools?category=${cat}`, changefreq: 'weekly', priority: '0.7' })),

		...(posts || []).map(p => ({ loc: `${siteUrl}/blog/${p.slug}`, lastmod: p.updated_at, priority: '0.8' })),
		...(news || []).map(n => ({ loc: `${siteUrl}/news/${n.slug}`, lastmod: n.updated_at, priority: '0.8' })),
		...(tools || []).map(t => ({ loc: `${siteUrl}/ai-tools/${t.slug}`, lastmod: t.updated_at, priority: '0.7' })),
		...(pages || []).map(p => ({ loc: `${siteUrl}/pages/${p.slug}`, lastmod: p.updated_at, priority: '0.7' }))
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
	xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    ${formatLastmod(u.lastmod) ? `<lastmod>${formatLastmod(u.lastmod)}</lastmod>` : ''}
    <changefreq>${u.changefreq || 'weekly'}</changefreq>
    <priority>${u.priority || '0.7'}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(u.loc)}" />
  </url>`).join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
