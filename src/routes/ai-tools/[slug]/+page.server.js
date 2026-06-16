import { error } from '@sveltejs/kit';
import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ params, cookies, url, setHeaders }) {
	setHeaders({
		'cache-control': 'public, max-age=60, stale-while-revalidate=300'
	});
	const client = await getSupabaseServerClient({ cookies, url });

	const { data: tool, error: err } = await client
		.from('ai_tools')
		.select('*')
		.eq('slug', params.slug)
		.single();

	if (err || !tool) {
		throw error(404, 'AI Tool not found');
	}

	return { tool };
}
