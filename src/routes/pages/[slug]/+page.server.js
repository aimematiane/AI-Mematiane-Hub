import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { error } from '@sveltejs/kit';

export async function load({ cookies, url, params }) {
	const client = await getSupabaseServerClient({ cookies, url });

	const { data: page, error: pageError } = await client
		.from('pages')
		.select('id, title, slug, content, sections, meta_title, meta_description, published_at')
		.eq('slug', params.slug)
		.eq('is_published', true)
		.is('deleted_at', null)
		.single();

	if (pageError || !page) throw error(404, 'Page not found');

	return { page };
}
