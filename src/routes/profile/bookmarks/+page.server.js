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

	// Fetch related items efficiently (fix N+1)
	const enrichedBookmarks = [];
	if (bookmarks && bookmarks.length > 0) {
		const aiToolIds = bookmarks.filter(b => b.item_type === 'ai_tool').map(b => b.item_id);
		const postIds = bookmarks.filter(b => b.item_type === 'post').map(b => b.item_id);
		const newsIds = bookmarks.filter(b => b.item_type === 'news').map(b => b.item_id);

		const promises = [];
		if (aiToolIds.length > 0) promises.push(client.from('ai_tools').select('id, name, slug, description, category, image_url').in('id', aiToolIds).then(res => ({ type: 'ai_tool', data: res.data })));
		if (postIds.length > 0) promises.push(client.from('posts').select('id, title, slug, excerpt, cover_image_url, category').in('id', postIds).then(res => ({ type: 'post', data: res.data })));
		if (newsIds.length > 0) promises.push(client.from('news').select('id, title, slug, excerpt, cover_image_url, category').in('id', newsIds).then(res => ({ type: 'news', data: res.data })));

		const results = await Promise.all(promises);
		const itemsMap = {
			ai_tool: new Map(results.find(r => r.type === 'ai_tool')?.data?.map(i => [i.id, i]) || []),
			post: new Map(results.find(r => r.type === 'post')?.data?.map(i => [i.id, i]) || []),
			news: new Map(results.find(r => r.type === 'news')?.data?.map(i => [i.id, i]) || []),
		};

		for (const bm of bookmarks) {
			const item = itemsMap[bm.item_type]?.get(bm.item_id);
			if (item) {
				enrichedBookmarks.push({ ...bm, item });
			}
		}
	}

	return { bookmarks: enrichedBookmarks };
}
