import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ url, cookies }) {
	const client = await getSupabaseServerClient({ cookies, url });
	const category = url.searchParams.get('category') || '';
	const search = url.searchParams.get('q') || '';
	const pricing = url.searchParams.get('pricing') || '';
	const sort = url.searchParams.get('sort') || 'featured';
	const page = parseInt(url.searchParams.get('page') || '1');
	const perPage = 12;

	let query = client
		.from('ai_tools')
		.select('*', { count: 'exact' })
		.range((page - 1) * perPage, page * perPage - 1);

	// Apply sort
	switch (sort) {
		case 'newest':
			query = query.order('created_at', { ascending: false });
			break;
		case 'oldest':
			query = query.order('created_at', { ascending: true });
			break;
		case 'name_asc':
			query = query.order('name', { ascending: true });
			break;
		case 'name_desc':
			query = query.order('name', { ascending: false });
			break;
		case 'featured':
		default:
			query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
			break;
	}

	// Apply filters
	if (category) query = query.eq('category', category);
	if (pricing) query = query.eq('pricing', pricing);
	if (search) query = query.ilike('name', `%${search}%`);

	const { data: tools, count, error } = await query;

	return {
		tools: tools || [],
		totalCount: count || 0,
		page,
		perPage,
		category,
		search,
		pricing,
		sort
	};
}
