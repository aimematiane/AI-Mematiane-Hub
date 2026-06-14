import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ params, cookies, url }) {
	const client = await getSupabaseServerClient({ cookies, url });

	const { data: item, error } = await client
		.from('news')
		.select('*, author:profiles(display_name, avatar_url)')
		.eq('slug', params.slug)
		.eq('is_published', true)
		.single();

	if (error || !item) {
		return { status: 404, item: null };
	}

	return { item };
}
