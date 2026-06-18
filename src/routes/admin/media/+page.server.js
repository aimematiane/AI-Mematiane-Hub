import { requireAdmin } from '$lib/server/auth.js';

export async function load(event) {
	const { client, user } = await requireAdmin(event, 'role');

	const { data: media } = await client
		.from('media_files')
		.select('id, filename, original_filename, mime_type, size_bytes, url, thumbnail_url, alt_text, folder, created_at, uploader:profiles(display_name)')
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	const folders = [...new Set(media?.map(m => m.folder) || [])].filter(Boolean);

	return {
		media: media || [],
		folders,
		user
	};
}

export const actions = {
	async upload(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const url_path = formData.get('url');
		const filename = formData.get('filename');
		const alt_text = formData.get('alt_text');
		const folder = formData.get('folder') || '/';

		await client.from('media_files').insert({
			filename: filename || url_path.split('/').pop(),
			original_filename: filename || url_path.split('/').pop(),
			mime_type: 'image/jpeg', // Would be determined in real upload
			size_bytes: 0,
			url: url_path,
			uploaded_by: user.id,
			folder,
			alt_text
		});

		return { success: true };
	},

	async delete(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');

		await client.from('media_files').update({ deleted_at: new Date().toISOString() }).eq('id', id);
		return { success: true };
	},

	async updateMeta(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');
		const alt_text = formData.get('alt_text');
		const title = formData.get('title');
		const description = formData.get('description');

		await client.from('media_files').update({ alt_text, title, description }).eq('id', id);
		return { success: true };
	}
};
