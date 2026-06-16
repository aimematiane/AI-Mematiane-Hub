import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { parsePage } from '$lib/utils/query.js';

export async function load({ url, cookies, setHeaders }) {
	setHeaders({
		'cache-control': 'public, max-age=60, stale-while-revalidate=300'
	});
	const client = await getSupabaseServerClient({ cookies, url });
	const page = parsePage(url.searchParams.get('page'));
	const perPage = 6;

	const { data: posts, count, error } = await client
		.from('posts')
		.select('id, title, slug, excerpt, cover_image_url, category, tags, reading_time_min, published_at, author:profiles(display_name, avatar_url)', { count: 'exact' })
		.eq('is_published', true)
		.order('published_at', { ascending: false })
		.range((page - 1) * perPage, page * perPage - 1);

	if (error) {
		console.error('[v0] Failed to load blog posts:', error.message);
	}

	return {
		posts: posts || [],
		totalCount: count || 0,
		page,
		perPage
	};
}
