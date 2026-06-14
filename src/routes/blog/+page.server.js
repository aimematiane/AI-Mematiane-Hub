import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ url, cookies }) {
	const client = await getSupabaseServerClient({ cookies, url });
	const page = parseInt(url.searchParams.get('page') || '1');
	const perPage = 6;

	const { data: posts, count, error } = await client
		.from('posts')
		.select('id, title, slug, excerpt, cover_image_url, category, tags, reading_time_min, published_at, author:profiles(display_name, avatar_url)', { count: 'exact' })
		.eq('is_published', true)
		.order('published_at', { ascending: false })
		.range((page - 1) * perPage, page * perPage - 1);

	return {
		posts: posts || [],
		totalCount: count || 0,
		page,
		perPage
	};
}
