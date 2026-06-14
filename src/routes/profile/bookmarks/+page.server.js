import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { redirect } from '@sveltejs/kit';

export async function load({ cookies, url }) {
	const client = await getSupabaseServerClient({ cookies, url });
	const { data: { user } } = await client.auth.getUser();

	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const { data: bookmarks } = await client
		.from('bookmarks')
		.select('id, item_type, item_id, created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	// Fetch related items
	const enrichedBookmarks = [];
	if (bookmarks && bookmarks.length > 0) {
		for (const bm of bookmarks) {
			let item = null;
			if (bm.item_type === 'ai_tool') {
				const { data } = await client.from('ai_tools').select('id, name, slug, description, category, image_url').eq('id', bm.item_id).single();
				item = data;
			} else if (bm.item_type === 'post') {
				const { data } = await client.from('posts').select('id, title, slug, excerpt, cover_image_url, category').eq('id', bm.item_id).single();
				item = data;
			} else if (bm.item_type === 'news') {
				const { data } = await client.from('news').select('id, title, slug, excerpt, cover_image_url, category').eq('id', bm.item_id).single();
				item = data;
			}
			if (item) {
				enrichedBookmarks.push({ ...bm, item });
			}
		}
	}

	return { bookmarks: enrichedBookmarks };
}
