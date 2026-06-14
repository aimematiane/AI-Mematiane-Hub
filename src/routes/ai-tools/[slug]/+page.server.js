import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ params, cookies, url }) {
	const client = await getSupabaseServerClient({ cookies, url });

	const { data: tool, error } = await client
		.from('ai_tools')
		.select('*')
		.eq('slug', params.slug)
		.single();

	if (error || !tool) {
		return { status: 404, tool: null };
	}

	return { tool };
}
