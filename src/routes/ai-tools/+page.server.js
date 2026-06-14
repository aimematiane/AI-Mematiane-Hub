import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ url, cookies }) {
	const client = await getSupabaseServerClient({ cookies, url });
	const category = url.searchParams.get('category') || '';
	const search = url.searchParams.get('q') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const perPage = 12;

	let query = client
		.from('ai_tools')
		.select('*', { count: 'exact' })
		.order('is_featured', { ascending: false })
		.order('created_at', { ascending: false })
		.range((page - 1) * perPage, page * perPage - 1);

	if (category) query = query.eq('category', category);
	if (search) query = query.textSearch('name', search, { type: 'websearch' });

	const { data: tools, count, error } = await query;

	return {
		tools: tools || [],
		totalCount: count || 0,
		page,
		perPage,
		category,
		search
	};
}
