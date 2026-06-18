import { requireAdmin } from '$lib/server/auth.js';
import { logAudit } from '$lib/server/audit.js';
import { fail } from '@sveltejs/kit';

export async function load(event) {
	const { client } = await requireAdmin(event, 'role');

	const [posts, news, tools, pages] = await Promise.all([
		client.from('posts').select('id, title, slug, meta_title, meta_description, is_published').is('deleted_at', null),
		client.from('news').select('id, title, slug, meta_title, meta_description, is_published').is('deleted_at', null),
		client.from('ai_tools').select('id, name, slug, meta_title, meta_description').is('deleted_at', null),
		client.from('pages').select('id, title, slug, meta_title, meta_description, is_published').is('deleted_at', null)
	]);

	return {
		content: {
			posts: posts.data || [],
			news: news.data || [],
			tools: tools.data || [],
			pages: pages.data || []
		}
	};
}

export const actions = {
	async updateMeta(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const type = formData.get('type');
		const id = formData.get('id');
		const meta_title = formData.get('meta_title')?.toString() || '';
		const meta_description = formData.get('meta_description')?.toString() || '';

		const tableMap = {
			posts: 'posts',
			news: 'news',
			tools: 'ai_tools',
			pages: 'pages'
		};
		const table = tableMap[type];
		if (!table) return fail(400, { message: 'Invalid content type' });

		const { error } = await client
			.from(table)
			.update({ meta_title, meta_description })
			.eq('id', id);

		if (error) return fail(400, { message: error.message });

		await logAudit(client, {
			userId: user.id,
			action: 'update_seo',
			entityType: type,
			entityId: id,
			newValues: { meta_title, meta_description }
		});

		return { success: true };
	}
};
