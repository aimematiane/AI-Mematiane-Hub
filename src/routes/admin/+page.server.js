import { requireAdmin } from '$lib/server/auth.js';

export async function load(event) {
	const { client, user } = await requireAdmin(event, 'role');

	const [toolsResult, postsResult, newsResult] = await Promise.all([
		client.from('ai_tools').select('id', { count: 'exact', head: true }),
		client.from('posts').select('id', { count: 'exact', head: true }),
		client.from('news').select('id', { count: 'exact', head: true })
	]);

	return {
		user,
		counts: {
			tools: toolsResult.count || 0,
			posts: postsResult.count || 0,
			news: newsResult.count || 0
		}
	};
}
