import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/private';

export function getSupabaseAdminClient() {
	return createServerClient(
		import.meta.env.VITE_SUPABASE_URL,
		env.SUPABASE_SERVICE_ROLE_KEY,
		{
			cookies: {
				getAll() { return []; },
				setAll() {}
			}
		}
	);
}
