import { requireAdmin } from '$lib/server/auth.js';

export async function load(event) {
	const { client } = await requireAdmin(event, 'role');

	const { data: logs } = await client
		.from('audit_logs')
		.select('*, user:profiles(display_name, email)')
		.order('created_at', { ascending: false })
		.limit(200);

	return { logs: logs || [] };
}
