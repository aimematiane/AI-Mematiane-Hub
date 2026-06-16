import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ cookies, url }) {
	const client = await getSupabaseServerClient({ cookies, url });
	
	const { data: { user } } = await client.auth.getUser();

	return {
		user
	};
}
