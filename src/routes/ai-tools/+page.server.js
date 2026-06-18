import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { applyAiToolsQueryFilters } from '$lib/utils/pagination.js';

export async function load({ url, cookies, setHeaders }) {
	setHeaders({
		'cache-control': 'public, max-age=60, stale-while-revalidate=300'
	});
	const client = await getSupabaseServerClient({ cookies, url });
	const category = url.searchParams.get('category') || '';
	const search = url.searchParams.get('q') || '';
	const pricing = url.searchParams.get('pricing') || '';
	const sort = url.searchParams.get('sort') || 'featured';
	const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1);
	const perPage = 12;

	let query = client
		.from('ai_tools')
		.select('*', { count: 'exact' })
		.range((page - 1) * perPage, page * perPage - 1);

	query = applyAiToolsQueryFilters(query, { category, search, pricing, sort });

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
