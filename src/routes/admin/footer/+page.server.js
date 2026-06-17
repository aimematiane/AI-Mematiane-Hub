import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { redirect } from '@sveltejs/kit';

export async function load({ cookies, url }) {
	const client = await getSupabaseServerClient({ cookies, url });
	const { data: { user } } = await client.auth.getUser();

	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const { data: profile } = await client
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	if (!profile || profile.role !== 'admin') {
		throw redirect(302, '/profile');
	}

	const { data: settings } = await client
		.from('footer_settings')
		.select('*')
		.order('sort_order');

	const { data: columns } = await client
		.from('footer_columns')
		.select('*, links:footer_links(*)')
		.order('sort_order');

	return {
		settings: settings || [],
		columns: columns || []
	};
}

export const actions = {
	async updateSettings({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const settingsJson = formData.get('settings');
		const settings = JSON.parse(settingsJson);

		for (const setting of settings) {
			await client.from('footer_settings').update({ value: setting.value }).eq('id', setting.id);
		}
		return { success: true };
	},

	async createColumn({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const title = formData.get('title');
		const sort_order = parseInt(formData.get('sort_order') || '0');

		await client.from('footer_columns').insert({ title, sort_order });
		return { success: true };
	},

	async updateColumn({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const id = formData.get('id');
		const title = formData.get('title');
		const is_visible = formData.get('is_visible') === 'true';

		await client.from('footer_columns').update({ title, is_visible }).eq('id', id);
		return { success: true };
	},

	async deleteColumn({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const id = formData.get('id');
		await client.from('footer_columns').delete().eq('id', id);
		return { success: true };
	},

	async createLink({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const column_id = formData.get('column_id');
		const label = formData.get('label');
		const url_path = formData.get('url');
		const is_external = formData.get('is_external') === 'true';
		const sort_order = parseInt(formData.get('sort_order') || '0');

		await client.from('footer_links').insert({ column_id, label, url: url_path, is_external, sort_order });
		return { success: true };
	},

	async deleteLink({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const id = formData.get('id');
		await client.from('footer_links').delete().eq('id', id);
		return { success: true };
	}
};
