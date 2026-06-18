import { requireAdmin } from '$lib/server/auth.js';
import { logAudit } from '$lib/server/audit.js';
import { fail } from '@sveltejs/kit';

export async function load(event) {
	const { client } = await requireAdmin(event, 'role');

	const { data: themeSettings } = await client
		.from('theme_settings')
		.select('*')
		.order('category')
		.order('sort_order');

	const categories = [...new Set(themeSettings?.map(s => s.category) || [])];

	return {
		themeSettings: themeSettings || [],
		categories
	};
}

export const actions = {
	async update(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const settings = JSON.parse(formData.get('settings'));

		for (const setting of settings) {
			const { error } = await client
				.from('theme_settings')
				.update({ value: setting.value })
				.eq('id', setting.id);
			if (error) return fail(400, { message: error.message });
		}

		await logAudit(client, {
			userId: user.id,
			action: 'update_theme',
			entityType: 'theme_settings',
			newValues: { count: settings.length }
		});

		return { success: true };
	}
};
