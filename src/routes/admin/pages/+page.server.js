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

	const { data: pages } = await client
		.from('pages')
		.select('id, title, slug, is_published, published_at, created_at, author:profiles(display_name)')
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	return { pages: pages || [] };
}

export const actions = {
	async create({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const title = formData.get('title');
		const slug = formData.get('slug') || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

		const { data, error } = await client
			.from('pages')
			.insert({ title, slug, author_id: (await client.auth.getUser()).data.user?.id })
			.select('id')
			.single();

		if (error) {
			return { error: error.message };
		}
		return { success: true, id: data.id };
	},

	async delete({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const id = formData.get('id');

		await client.from('pages').update({ deleted_at: new Date().toISOString() }).eq('id', id);
		return { success: true };
	},

	async publish({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const id = formData.get('id');

		await client.from('pages')
			.update({ is_published: true, published_at: new Date().toISOString() })
			.eq('id', id);
		return { success: true };
	},

	async unpublish({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const id = formData.get('id');

		await client.from('pages').update({ is_published: false }).eq('id', id);
		return { success: true };
	}
};
