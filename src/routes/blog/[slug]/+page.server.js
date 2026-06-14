import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { extractHeadings } from '$lib/utils/marked.js';

export async function load({ params, cookies, url }) {
	const client = await getSupabaseServerClient({ cookies, url });

	const { data: post, error } = await client
		.from('posts')
		.select('*, author:profiles(display_name, avatar_url)')
		.eq('slug', params.slug)
		.eq('is_published', true)
		.single();

	if (error || !post) {
		return { status: 404, post: null, headings: [] };
	}

	const headings = extractHeadings(post.content);

	return { post, headings };
}
