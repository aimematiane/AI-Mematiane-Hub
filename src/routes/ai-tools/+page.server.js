import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { parsePage, sanitizeSearch, allowFrom, ALLOWED_CATEGORIES, ALLOWED_PRICING, ALLOWED_SORTS } from '$lib/utils/query.js';

export async function load({ url, cookies, setHeaders }) {
	setHeaders({
		'cache-control': 'public, max-age=60, stale-while-revalidate=300'
	});
	const client = await getSupabaseServerClient({ cookies, url });
	const category = allowFrom(url.searchParams.get('category'), ALLOWED_CATEGORIES);
	const search = sanitizeSearch(url.searchParams.get('q'));
	const pricing = allowFrom(url.searchParams.get('pricing'), ALLOWED_PRICING);
	const sort = allowFrom(url.searchParams.get('sort'), ALLOWED_SORTS) || 'featured';
	const page = parsePage(url.searchParams.get('page'));
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

	if (error) {
		console.error('[v0] Failed to load AI tools:', error.message);
	}

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
