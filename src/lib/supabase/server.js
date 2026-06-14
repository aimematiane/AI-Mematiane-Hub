import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/private';

export async function getSupabaseServerClient(event) {
	return createServerClient(
		event.url.origin,
		env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
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
