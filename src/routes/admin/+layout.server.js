import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { redirect } from '@sveltejs/kit';

export async function load({ cookies, url }) {
	const client = await getSupabaseServerClient({ cookies, url });
	const { data: { user } } = await client.auth.getUser();

	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const { data: profile, error: profileError } = await client
		.from('profiles')
		.select('id, email, display_name, avatar_url, role')
		.eq('id', user.id)
		.single();

	if (profileError) {
		console.error('Profile fetch error:', profileError);
		throw redirect(302, '/auth/login');
	}

	if (!profile) {
		console.log('No profile found');
		throw redirect(302, '/auth/login');
	}

	console.log('Admin layout check - User role:', profile.role);

	// Allow all roles except 'user' to access admin panel
	if (profile.role === 'user') {
		console.log('User role cannot access admin');
		throw redirect(302, '/profile');
	}

	console.log('Admin check passed, fetching counts...');

	// Get all counts for sidebar badges
	const [toolsResult, postsResult, newsResult, pagesResult, usersResult, mediaResult] = await Promise.all([
		client.from('ai_tools').select('id', { count: 'exact', head: true }).is('deleted_at', null),
		client.from('posts').select('id', { count: 'exact', head: true }).is('deleted_at', null),
		client.from('news').select('id', { count: 'exact', head: true }).is('deleted_at', null),
		client.from('pages').select('id', { count: 'exact', head: true }).is('deleted_at', null),
		client.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
		client.from('media_files').select('id', { count: 'exact', head: true }).is('deleted_at', null)
	]);

	console.log('Counts fetched successfully');

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
