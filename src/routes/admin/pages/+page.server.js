import { requireAdmin } from '$lib/server/auth.js';
import { fail } from '@sveltejs/kit';

export async function load(event) {
	const { client } = await requireAdmin(event, 'role');

	const { data: pages } = await client
		.from('pages')
		.select('id, title, slug, is_published, published_at, created_at, author:profiles(display_name)')
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	return { pages: pages || [] };
}

export const actions = {
	async create(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const title = String(formData.get('title') || '').trim();
		const slugInput = String(formData.get('slug') || '').trim();
		const slug = (slugInput || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

		if (!title) return fail(400, { message: 'Page title is required.' });
		if (!slug) return fail(400, { message: 'Page slug is required.' });

		const { data, error } = await client
			.from('pages')
			.insert({ title, slug, author_id: user.id, sections: [], content: '' })
			.select('id')
			.single();

		if (error) {
			const message = error.code === '23505'
				? 'A page with this slug already exists. Choose another URL slug.'
				: error.message;
			return fail(400, { message });
		}
		return { success: true, id: data.id };
	},

	async delete(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');

		await client.from('pages').update({ deleted_at: new Date().toISOString() }).eq('id', id);
		return { success: true };
	},

	async publish(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');

		await client.from('pages')
			.update({ is_published: true, published_at: new Date().toISOString() })
			.eq('id', id);
		return { success: true };
	},

	async unpublish(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');

		await client.from('pages').update({ is_published: false }).eq('id', id);
		return { success: true };
	}
};
