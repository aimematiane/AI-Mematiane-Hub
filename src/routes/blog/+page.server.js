import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { loadContentMetrics } from '$lib/server/contentMetrics.js';

export async function load({ url, cookies, setHeaders }) {
	setHeaders({
		'cache-control': 'public, max-age=60, stale-while-revalidate=300'
	});
	const client = await getSupabaseServerClient({ cookies, url });
	const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1);
	const perPage = 6;

	const { data: posts, count, error } = await client
		.from('posts')
		.select('id, title, slug, excerpt, cover_image_url, category, tags, created_at, author:profiles(display_name, avatar_url)', { count: 'exact' })
		.eq('is_published', true)
		.order('published_at', { ascending: false })
		.range((page - 1) * perPage, page * perPage - 1);

	const metrics = await loadContentMetrics(client, 'post', (posts || []).map((post) => post.id));

	return {
		posts: (posts || []).map((post) => ({ ...post, metrics: metrics[post.id] })),
		totalCount: count || 0,
		page,
		perPage
	};
}
