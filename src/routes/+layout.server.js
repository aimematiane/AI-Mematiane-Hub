import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ cookies, url }) {
	const client = await getSupabaseServerClient({ cookies, url });

	let user = null;
	try {
		const { data, error } = await client.auth.getUser();
		if (!error) user = data.user;
	} catch (e) {
		// Gracefully handle invalid/expired refresh tokens
	}

	// Fetch published pages that are set to show in navbar
	const { data: navPages } = await client
		.from('pages')
		.select('id, title, slug')
		.eq('is_published', true)
		.eq('show_in_menu', true)
		.is('deleted_at', null)
		.order('created_at', { ascending: true });

	return {
		user,
		navPages: navPages || []
	};
}

