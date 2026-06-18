import { requireAdmin } from '$lib/server/auth.js';

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
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const settingsJson = formData.get('settings');
		const settings = JSON.parse(settingsJson);

		for (const setting of settings) {
			await client
				.from('theme_settings')
				.update({ value: setting.value })
				.eq('id', setting.id);
		}

		return { success: true };
	}
};
