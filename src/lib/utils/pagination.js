/**
 * Apply listing filters to a Supabase query — mirrors +page.server.js logic.
 */
export function applyAiToolsQueryFilters(query, { category = '', search = '', pricing = '', sort = 'featured' } = {}) {
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

	if (category) query = query.eq('category', category);
	if (pricing) query = query.eq('pricing', pricing);
	if (search) query = query.ilike('name', `%${search}%`);

	return query;
}

export function applyNewsQueryFilters(query, { category = '' } = {}) {
	query = query.eq('is_published', true).order('published_at', { ascending: false });
	if (category) query = query.eq('category', category);
	return query;
}
