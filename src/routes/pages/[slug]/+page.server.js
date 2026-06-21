import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { error } from '@sveltejs/kit';
import { sanitizeHtml } from '$lib/utils/marked.js';

function ensureArray(value) {
	return Array.isArray(value) ? value : [];
}

function normalizeItems(items, prefix) {
	return ensureArray(items).filter(Boolean).map((item, index) => ({
		...item,
		id: item.id || `${prefix}-${index}`
	}));
}

function sanitizeSections(sections = []) {
	return ensureArray(sections).filter(Boolean).map((section, index) => {
		const data = section.data && typeof section.data === 'object' ? section.data : {};
		const normalized = {
			...section,
			id: section.id || `${section.type || 'section'}-${index}`,
			data: {
				...data,
				cards: normalizeItems(data.cards, `${section.type || 'section'}-${index}-card`),
				items: normalizeItems(data.items, `${section.type || 'section'}-${index}-item`),
				images: normalizeItems(data.images, `${section.type || 'section'}-${index}-image`)
			}
		};

		if (section?.type !== 'rich_text') return normalized;
		return {
			...normalized,
			data: {
				...normalized.data,
				content: sanitizeHtml(data.content || '')
			}
		};
	});
}

export async function load({ cookies, url, params }) {
	const client = await getSupabaseServerClient({ cookies, url });

	const { data: page, error: pageError } = await client
		.from('pages')
		.select('id, title, slug, content, sections, meta_title, meta_description, published_at')
		.eq('slug', params.slug)
		.eq('is_published', true)
		.is('deleted_at', null)
		.single();

	if (pageError || !page) throw error(404, 'Page not found');

	page.content = sanitizeHtml(page.content || '');
	page.sections = sanitizeSections(page.sections || []);

	return { page };
}
