import { requireAdmin } from '$lib/server/auth.js';

export async function load(event) {
	const { client } = await requireAdmin(event, 'role');

	const { data: menus } = await client
		.from('navigation_menus')
		.select('*')
		.order('name');

	const { data: items } = await client
		.from('navigation_items')
		.select('*')
		.order('sort_order');

	return {
		menus: menus || [],
		items: items || []
	};
}

export const actions = {
	async createMenu(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const name = formData.get('name');
		const location = formData.get('location');

		await client.from('navigation_menus').insert({ name, location });
		return { success: true };
	},

	async updateMenu(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');
		const name = formData.get('name');
		const location = formData.get('location');
		const is_active = formData.get('is_active') === 'true';

		await client.from('navigation_menus').update({ name, location, is_active }).eq('id', id);
		return { success: true };
	},

	async deleteMenu(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');
		await client.from('navigation_menus').delete().eq('id', id);
		return { success: true };
	},

	async createItem(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const menu_id = formData.get('menu_id');
		const parent_id = formData.get('parent_id') || null;
		const label = formData.get('label');
		const url_path = formData.get('url');
		const is_external = formData.get('is_external') === 'true';
		const open_in_new_tab = formData.get('open_in_new_tab') === 'true';
		const sort_order = parseInt(formData.get('sort_order') || '0');

		await client.from('navigation_items').insert({
			menu_id, parent_id, label, url: url_path, is_external, open_in_new_tab, sort_order
		});
		return { success: true };
	},

	async updateItem(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');
		const label = formData.get('label');
		const url_path = formData.get('url');
		const is_external = formData.get('is_external') === 'true';
		const open_in_new_tab = formData.get('open_in_new_tab') === 'true';
		const sort_order = parseInt(formData.get('sort_order') || '0');
		const is_visible = formData.get('is_visible') === 'true';

		await client.from('navigation_items').update({
			label, url: url_path, is_external, open_in_new_tab, sort_order, is_visible
		}).eq('id', id);
		return { success: true };
	},

	async deleteItem(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');
		await client.from('navigation_items').delete().eq('id', id);
		return { success: true };
	},

	async reorderItems(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const items = JSON.parse(formData.get('items'));

		for (const item of items) {
			await client.from('navigation_items')
				.update({ sort_order: item.sort_order, parent_id: item.parent_id || null })
				.eq('id', item.id);
		}
		return { success: true };
	}
};
