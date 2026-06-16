import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function GET({ url, cookies }) {
	const code = url.searchParams.get('code');
	let next = url.searchParams.get('next') || '/profile';

	// Prevent open redirect — only allow safe relative paths
	if (!next.startsWith('/') || next.startsWith('//')) {
		next = '/profile';
	}

	if (code) {
		const client = await getSupabaseServerClient({ cookies, url });
		const { error } = await client.auth.exchangeCodeForSession(code);
		if (!error) {
			return new Response(null, {
				status: 302,
				headers: { Location: next }
			});
		}
	}

	return new Response(null, {
		status: 302,
		headers: { Location: '/auth/login' }
	});
}
