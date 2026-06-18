import { requireAdmin } from '$lib/server/auth.js';

export async function load(event) {
	const { client, user } = await requireAdmin(event, 'role');

	const { data: newsItems } = await client
		.from('news')
		.select('*')
		.order('created_at', { ascending: false });

	return { newsItems: newsItems || [], userId: user.id };
}
