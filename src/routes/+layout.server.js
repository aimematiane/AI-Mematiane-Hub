import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ cookies, url }) {
	const client = await getSupabaseServerClient({ cookies, url });
	
	let user = null;
	try {
		const { data, error } = await client.auth.getUser();
		if (!error) {
			user = data.user;
		}
	} catch (e) {
		// Gracefully handle invalid/expired refresh tokens
		// User will be null (logged-out state)
	}

	return {
		user
	};
}
