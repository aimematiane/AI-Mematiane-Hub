import { createBrowserClient } from '@supabase/ssr';

let clientSingleton;

export function getSupabaseBrowserClient() {
	if (!clientSingleton) {
		clientSingleton = createBrowserClient(
			import.meta.env.VITE_SUPABASE_URL,
			import.meta.env.VITE_SUPABASE_ANON_KEY
		);
	}
	return clientSingleton;
}
