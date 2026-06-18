import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { applyNewsQueryFilters } from '$lib/utils/pagination.js';

export async function load({ url, cookies, setHeaders }) {
	setHeaders({
		'cache-control': 'public, max-age=60, stale-while-revalidate=300'
	});
	const client = await getSupabaseServerClient({ cookies, url });
	const category = url.searchParams.get('category') || '';
	const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1);
	const perPage = 9;

	let query = client
		.from('news')
		.select('id, title, slug, excerpt, cover_image_url, category, tags, reading_time_min, published_at', { count: 'exact' })
		.range((page - 1) * perPage, page * perPage - 1);

	query = applyNewsQueryFilters(query, { category });

	const { data: newsItems, count, error } = await query;

	return {
		newsItems: newsItems || [],
		totalCount: count || 0,
		page,
		perPage,
		category
	};
}
