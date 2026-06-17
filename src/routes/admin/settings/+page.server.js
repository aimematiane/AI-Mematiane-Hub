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

	if (!profile || profile.role === 'user') {
		throw redirect(302, '/profile');
	}

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
	async update({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const settingsJson = formData.get('settings');
		const settings = JSON.parse(settingsJson);

		for (const setting of settings) {
			if (setting.value_json !== undefined && setting.value_json !== null) {
				await client
					.from('site_settings')
					.update({ value_json: setting.value_json })
					.eq('id', setting.id);
			} else {
				await client
					.from('site_settings')
					.update({ value: setting.value })
					.eq('id', setting.id);
			}
		}

		return { success: true };
	}
};
