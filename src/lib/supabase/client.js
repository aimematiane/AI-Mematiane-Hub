import { createBrowserClient } from '@supabase/ssr';
import { browser } from '$app/environment';

let clientSingleton;

export function getSupabaseBrowserClient() {
	if (!browser) return null;

	if (!clientSingleton) {
		clientSingleton = createBrowserClient(
			import.meta.env.VITE_SUPABASE_URL,
			import.meta.env.VITE_SUPABASE_ANON_KEY
		);
	}
	return clientSingleton;
}
