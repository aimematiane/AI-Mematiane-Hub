import { requireAdmin } from '$lib/server/auth.js';
import { logAudit } from '$lib/server/audit.js';
import { fail } from '@sveltejs/kit';

export async function load(event) {
	const { client } = await requireAdmin(event, 'role');

	const { data: settings } = await client
		.from('site_settings')
		.select('*')
		.order('category')
		.order('sort_order');

	const categories = [...new Set(settings?.map(s => s.category) || [])];

	return {
		settings: settings || [],
		categories
	};
}

export const actions = {
	async update(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const settingsJson = formData.get('settings');
		const settings = JSON.parse(settingsJson);

		for (const setting of settings) {
			const payload = setting.value_json !== undefined && setting.value_json !== null
				? { value_json: setting.value_json }
				: { value: setting.value };

			const { error } = await client.from('site_settings').update(payload).eq('id', setting.id);
			if (error) return fail(400, { message: error.message });
		}

		await logAudit(client, {
			userId: user.id,
			action: 'update_settings',
			entityType: 'site_settings',
			newValues: { count: settings.length }
		});

		return { success: true };
	}
};
