import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function GET(event) {
	const client = await getSupabaseServerClient(event);
	const siteUrl = 'https://ai-mematiane.com';

	const [{ data: posts }, { data: news }] = await Promise.all([
		client.from('posts').select('title, slug, excerpt, published_at').eq('is_published', true).order('published_at', { ascending: false }).limit(20),
		client.from('news').select('title, slug, excerpt, published_at').eq('is_published', true).order('published_at', { ascending: false }).limit(20)
	]);

	const feedItems = [
		...(posts || []).map(p => ({
			title: p.title,
			link: `${siteUrl}/blog/${p.slug}`,
			description: p.excerpt,
			pubDate: new Date(p.published_at).toUTCString(),
			guid: `${siteUrl}/blog/${p.slug}`
		})),
		...(news || []).map(n => ({
			title: n.title,
			link: `${siteUrl}/news/${n.slug}`,
			description: n.excerpt,
			pubDate: new Date(n.published_at).toUTCString(),
			guid: `${siteUrl}/news/${n.slug}`
		}))
	];

	// Sort by date descending
	feedItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

	const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
	<title>AI Mematiane</title>
	<link>${siteUrl}</link>
	<description>Global directory of AI models, tools, news, and deep-dive analysis</description>
	<language>en-us</language>
	<atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
	${feedItems.map(item => `
	<item>
		<title><![CDATA[${item.title}]]></title>
		<link>${item.link}</link>
		<guid>${item.guid}</guid>
		<pubDate>${item.pubDate}</pubDate>
		<description><![CDATA[${item.description}]]></description>
	</item>`).join('')}
</channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
