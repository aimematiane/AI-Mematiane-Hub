import { requireAdmin } from '$lib/server/auth.js';

export async function load(event) {
	const { client, user, profile } = await requireAdmin(event);

	const [toolsResult, postsResult, newsResult, pagesResult, usersResult, mediaResult] = await Promise.all([
		client.from('ai_tools').select('id', { count: 'exact', head: true }).is('deleted_at', null),
		client.from('posts').select('id', { count: 'exact', head: true }).is('deleted_at', null),
		client.from('news').select('id', { count: 'exact', head: true }).is('deleted_at', null),
		client.from('pages').select('id', { count: 'exact', head: true }).is('deleted_at', null),
		client.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
		client.from('media_files').select('id', { count: 'exact', head: true }).is('deleted_at', null)
	]);

	return {
		user,
		profile,
		counts: {
			tools: toolsResult.count || 0,
			posts: postsResult.count || 0,
			news: newsResult.count || 0,
			pages: pagesResult.count || 0,
			users: usersResult.count || 0,
			media: mediaResult.count || 0
		}
	};
}
