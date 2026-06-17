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

	if (!profile || profile.role === 'user') {
		throw redirect(302, '/profile');
	}

	const { data: logs } = await client
		.from('audit_logs')
		.select('*, user:profiles(display_name, email)')
		.order('created_at', { ascending: false })
		.limit(200);

	return { logs: logs || [] };
}
