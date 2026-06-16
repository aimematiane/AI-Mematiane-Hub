import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { parsePage, allowFrom, ALLOWED_CATEGORIES } from '$lib/utils/query.js';

export async function load({ url, cookies, setHeaders }) {
	setHeaders({
		'cache-control': 'public, max-age=60, stale-while-revalidate=300'
	});
	const client = await getSupabaseServerClient({ cookies, url });
	const category = allowFrom(url.searchParams.get('category'), ALLOWED_CATEGORIES);
	const page = parsePage(url.searchParams.get('page'));
	const perPage = 9;

	let query = client
		.from('news')
		.select('id, title, slug, excerpt, cover_image_url, category, tags, reading_time_min, published_at', { count: 'exact' })
		.eq('is_published', true)
		.order('published_at', { ascending: false })
		.range((page - 1) * perPage, page * perPage - 1);

	if (category) query = query.eq('category', category);

	const { data: newsItems, count, error } = await query;

	if (error) {
		console.error('[v0] Failed to load news:', error.message);
	}

	return {
		newsItems: newsItems || [],
		totalCount: count || 0,
		page,
		perPage,
		category
	};
}
