import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/private';

export async function getSupabaseServerClient(event) {
	return createServerClient(
		env.VITE_SUPABASE_URL,
		env.VITE_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll() {
					return event.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);
}
