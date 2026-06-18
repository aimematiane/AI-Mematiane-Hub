import { requireAdmin } from '$lib/server/auth.js';
import { logAudit } from '$lib/server/audit.js';
import { fail } from '@sveltejs/kit';

const STATIC_NAV_LINKS = [
	{ label: 'AI Showcase', href: '/ai-tools', description: 'Curated AI tools directory' },
	{ label: 'News', href: '/news', description: 'Latest AI news and updates' },
	{ label: 'Blog', href: '/blog', description: 'Deep-dive articles and analysis' }
];

export async function load(event) {
	const { client } = await requireAdmin(event, 'role');

	const { data: pages } = await client
		.from('pages')
		.select('id, title, slug, show_in_menu, is_published, updated_at')
		.is('deleted_at', null)
		.order('title');

	return {
		staticLinks: STATIC_NAV_LINKS,
		pages: pages || []
	};
}

export const actions = {
	async togglePageMenu(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');
		const showInMenu = formData.get('show_in_menu') === 'true';

		const { error } = await client
			.from('pages')
			.update({ show_in_menu: showInMenu })
			.eq('id', id);

		if (error) return fail(400, { message: error.message });

		await logAudit(client, {
			userId: user.id,
			action: 'update_navigation',
			entityType: 'pages',
			entityId: id,
			newValues: { show_in_menu: showInMenu }
		});

		return { success: true };
	}
};
