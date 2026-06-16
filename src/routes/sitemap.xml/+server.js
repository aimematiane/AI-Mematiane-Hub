import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function GET(event) {
	const client = await getSupabaseServerClient(event);
	const siteUrl = 'https://ai-mematiane.com';

	const [{ data: posts }, { data: news }, { data: tools }] = await Promise.all([
		client.from('posts').select('slug, updated_at').eq('is_published', true),
		client.from('news').select('slug, updated_at').eq('is_published', true),
		client.from('ai_tools').select('slug, updated_at')
	]);

	const staticPages = ['/', '/ai-tools', '/blog', '/news'];
	const urls = [
		...staticPages.map(p => ({ loc: `${siteUrl}${p}`, changefreq: 'daily', priority: '0.9' })),
		...(posts || []).map(p => ({ loc: `${siteUrl}/blog/${p.slug}`, lastmod: p.updated_at, priority: '0.8' })),
		...(news || []).map(n => ({ loc: `${siteUrl}/news/${n.slug}`, lastmod: n.updated_at, priority: '0.8' })),
		...(tools || []).map(t => ({ loc: `${siteUrl}/ai-tools/${t.slug}`, lastmod: t.updated_at, priority: '0.7' }))
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
    <changefreq>${u.changefreq || 'weekly'}</changefreq>
    <priority>${u.priority || '0.7'}</priority>
  </url>`).join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
