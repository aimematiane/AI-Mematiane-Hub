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
		.select('id, email, display_name, avatar_url, role')
		.eq('id', user.id)
		.single();

	if (!profile) {
		throw redirect(302, '/auth/login');
	}

	// Check if user has any admin role
	const { data: userRoles } = await client
		.from('user_roles')
		.select('role_id, roles(level)')
		.eq('user_id', user.id);

	const isAdmin = profile.role === 'admin' || (userRoles && userRoles.some(ur => ur.roles?.level >= 50));

	if (!isAdmin) {
		throw redirect(302, '/profile');
	}

	// Get all counts for sidebar badges
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
		userRoles,
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
