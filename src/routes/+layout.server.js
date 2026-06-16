import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ cookies, url }) {
	const client = await getSupabaseServerClient({ cookies, url });
	
	const { data: { session } } = await client.auth.getSession();
	const { data: { user } } = await client.auth.getUser();

	return {
		session,
		user
	};
}
