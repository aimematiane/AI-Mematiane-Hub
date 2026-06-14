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

	// Get counts
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
