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
		const type = typeof section.type === 'string' && section.type ? section.type : 'rich_text';
		const data = section.data && typeof section.data === 'object' ? section.data : {};
		const normalized = {
			...section,
			id: section.id || `${type}-${index}`,
			type,
			data: {
				...data,
				cards: normalizeItems(data.cards, `${type}-${index}-card`),
				items: normalizeItems(data.items, `${type}-${index}-item`),
				images: normalizeItems(data.images, `${type}-${index}-image`)
			}
		};

		if (type !== 'rich_text') return normalized;
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

	const safePage = { ...page };
	try {
		safePage.content = sanitizeHtml(page.content || '');
		safePage.sections = sanitizeSections(page.sections || []);
	} catch (err) {
		console.error('Failed to normalize public page content', {
			slug: params.slug,
			message: err?.message
		});
		safePage.content = sanitizeHtml(page.content || '');
		safePage.sections = [];
	}

	return { page: safePage };
}
