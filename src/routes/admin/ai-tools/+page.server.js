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

	const { data: tools } = await client
		.from('ai_tools')
		.select('*')
		.order('created_at', { ascending: false });

	return { tools: tools || [], user };
}
