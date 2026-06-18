import { requireAdmin } from '$lib/server/auth.js';
import { logAudit } from '$lib/server/audit.js';
import { guessMimeType } from '$lib/utils/media.js';
import { fail } from '@sveltejs/kit';

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
		const url_path = formData.get('url')?.toString() || '';
		const filename = formData.get('filename')?.toString() || url_path.split('/').pop() || 'file';
		const alt_text = formData.get('alt_text')?.toString() || '';
		const folder = formData.get('folder')?.toString() || 'media';

		const mime_type = guessMimeType(filename);

		const { error } = await client.from('media_files').insert({
			filename,
			original_filename: filename,
			mime_type,
			size_bytes: 0,
			url: url_path,
			uploaded_by: user.id,
			folder,
			alt_text
		});

		if (error) return fail(400, { message: error.message });

		await logAudit(client, {
			userId: user.id,
			action: 'media_upload',
			entityType: 'media_files',
			newValues: { url: url_path, filename }
		});

		return { success: true };
	},

	async delete(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');

		const { error } = await client.from('media_files').update({ deleted_at: new Date().toISOString() }).eq('id', id);
		if (error) return fail(400, { message: error.message });

		await logAudit(client, { userId: user.id, action: 'media_delete', entityType: 'media_files', entityId: id });
		return { success: true };
	},

	async updateMeta(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');
		const alt_text = formData.get('alt_text')?.toString() || '';
		const title = formData.get('title')?.toString() || '';
		const description = formData.get('description')?.toString() || '';

		const { error } = await client.from('media_files').update({ alt_text, title, description }).eq('id', id);
		if (error) return fail(400, { message: error.message });

		await logAudit(client, { userId: user.id, action: 'media_update', entityType: 'media_files', entityId: id });
		return { success: true };
	}
};
