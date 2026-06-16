import { error } from '@sveltejs/kit';
import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { extractHeadings } from '$lib/utils/marked.js';

export async function load({ params, cookies, url, setHeaders }) {
	setHeaders({
		'cache-control': 'public, max-age=60, stale-while-revalidate=300'
	});
	const client = await getSupabaseServerClient({ cookies, url });

	const { data: post, error: err } = await client
		.from('posts')
		.select('*, author:profiles(display_name, avatar_url)')
		.eq('slug', params.slug)
		.eq('is_published', true)
		.single();

	if (err || !post) {
		throw error(404, 'Post not found');
	}

	const headings = extractHeadings(post.content);

	return { post, headings };
}
