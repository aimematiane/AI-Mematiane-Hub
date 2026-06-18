import { requireAdmin } from '$lib/server/auth.js';

export async function load(event) {
	const { client } = await requireAdmin(event, 'role');

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
