import { requireAdmin } from '$lib/server/auth.js';

export async function load(event) {
	const { client, user } = await requireAdmin(event, 'role');

	const { data: posts } = await client
		.from('posts')
		.select('*')
		.order('created_at', { ascending: false });

	return { posts: posts || [], userId: user.id };
}
