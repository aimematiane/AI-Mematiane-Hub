import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { redirect } from '@sveltejs/kit';

export async function load({ cookies, url }) {
	const client = await getSupabaseServerClient({ cookies, url });
	const { data: { user } } = await client.auth.getUser();

	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const { data: profile } = await client
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	if (!profile || profile.role !== 'admin') {
		throw redirect(302, '/profile');
	}

	// Get all content for SEO overview
	const [posts, news, tools, pages] = await Promise.all([
		client.from('posts').select('id, title, slug, meta_title, meta_description, is_published').is('deleted_at', null),
		client.from('news').select('id, title, slug, meta_title, meta_description, is_published').is('deleted_at', null),
		client.from('ai_tools').select('id, name, slug, meta_title, meta_description').is('deleted_at', null),
		client.from('pages').select('id, title, slug, meta_title, meta_description, is_published').is('deleted_at', null)
	]);

	return {
		content: {
			posts: posts.data || [],
			news: news.data || [],
			tools: tools.data || [],
			pages: pages.data || []
		}
	};
}
