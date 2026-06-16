import { error } from '@sveltejs/kit';
import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ params, cookies, url }) {
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
