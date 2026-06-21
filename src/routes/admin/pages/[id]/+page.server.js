import { requireAdmin } from '$lib/server/auth.js';
import { redirect, error } from '@sveltejs/kit';

function ensureArray(value) {
	return Array.isArray(value) ? value : [];
}

function normalizeItems(items, prefix) {
	return ensureArray(items).filter(Boolean).map((item, index) => ({
		...item,
		id: item.id || `${prefix}-${index}`
	}));
}

function normalizeSections(sections = []) {
	return ensureArray(sections).filter(Boolean).map((section, index) => {
		const data = section.data && typeof section.data === 'object' ? section.data : {};
		return {
			...section,
			id: section.id || `${section.type || 'section'}-${index}`,
			type: section.type || 'rich_text',
			data: {
				...data,
				cards: normalizeItems(data.cards, `${section.type || 'section'}-${index}-card`),
				items: normalizeItems(data.items, `${section.type || 'section'}-${index}-item`),
				images: normalizeItems(data.images, `${section.type || 'section'}-${index}-image`)
			}
		};
	});
}

export async function load(event) {
	const { params } = event;
	const { client } = await requireAdmin(event, 'role');

	const { data: page, error: pageError } = await client
		.from('pages')
		.select('*')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (pageError || !page) throw error(404, 'Page not found');
	page.sections = normalizeSections(page.sections || []);

	return { page };
}

export const actions = {
	async save(event) {
		const { request, params } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();

		const title = formData.get('title');
		const slug = formData.get('slug');
		const meta_title = formData.get('meta_title');
		const meta_description = formData.get('meta_description');
		const show_in_menu = formData.get('show_in_menu') === 'true';

		// Parse sections JSON
		let sections = [];
		try {
			const sectionsRaw = formData.get('sections');
			if (sectionsRaw) sections = JSON.parse(sectionsRaw);
		} catch (e) {
			return { error: 'Invalid sections data' };
		}

		const { error: updateError } = await client
			.from('pages')
			.update({ title, slug, sections, meta_title, meta_description, show_in_menu, updated_at: new Date().toISOString() })
			.eq('id', params.id);

		if (updateError) return { error: updateError.message };
		return { success: true };
	},

	async publish(event) {
		const { params } = event;
		const { client } = await requireAdmin(event, 'role');
		await client.from('pages')
			.update({ is_published: true, published_at: new Date().toISOString() })
			.eq('id', params.id);
		return { success: true };
	},

	async unpublish(event) {
		const { params } = event;
		const { client } = await requireAdmin(event, 'role');
		await client.from('pages')
			.update({ is_published: false })
			.eq('id', params.id);
		return { success: true };
	},

	async delete(event) {
		const { params } = event;
		const { client } = await requireAdmin(event, 'role');
		await client.from('pages')
			.update({ deleted_at: new Date().toISOString() })
			.eq('id', params.id);
		throw redirect(302, '/admin/pages');
	}
};
