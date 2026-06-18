import { requireAdmin } from '$lib/server/auth.js';

export async function load(event) {
	const { client, user } = await requireAdmin(event, 'role');

	const { data: tools } = await client
		.from('ai_tools')
		.select('*')
		.order('created_at', { ascending: false });

	return { tools: tools || [], user };
}
