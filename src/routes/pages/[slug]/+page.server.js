import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { error } from '@sveltejs/kit';
import { sanitizeHtml } from '$lib/utils/marked.js';

function sanitizeSections(sections = []) {
	return sections.map((section) => {
		if (section?.type !== 'rich_text') return section;
		return {
			...section,
			data: {
				...section.data,
				content: sanitizeHtml(section.data?.content || '')
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
