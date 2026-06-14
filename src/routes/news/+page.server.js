import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ url, cookies }) {
	const client = await getSupabaseServerClient({ cookies, url });
	const category = url.searchParams.get('category') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const perPage = 9;

	let query = client
		.from('news')
		.select('id, title, slug, excerpt, cover_image_url, category, tags, reading_time_min, published_at', { count: 'exact' })
		.eq('is_published', true)
		.order('published_at', { ascending: false })
		.range((page - 1) * perPage, page * perPage - 1);

	if (category) query = query.eq('category', category);

	const { data: newsItems, count, error } = await query;

	return {
		newsItems: newsItems || [],
		totalCount: count || 0,
		page,
		perPage,
		category
	};
}
