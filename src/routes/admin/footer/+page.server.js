import { requireAdmin } from '$lib/server/auth.js';
import { logAudit } from '$lib/server/audit.js';
import { fail } from '@sveltejs/kit';

export async function load(event) {
	const { client } = await requireAdmin(event, 'role');

	const [settingsResult, columnsResult, socialLinksResult] = await Promise.all([
		client.from('footer_settings').select('*').order('sort_order'),
		client.from('footer_columns').select('*, links:footer_links(*)').order('sort_order'),
		client.from('footer_social_links').select('*').order('sort_order')
	]);

	return {
		settings: settingsResult.data || [],
		columns: columnsResult.data || [],
		socialLinks: socialLinksResult.data || []
	};
}

async function runMutation(client, user, action, entityType, entityId, fn) {
	const { error } = await fn();
	if (error) return fail(400, { message: error.message });
	await logAudit(client, { userId: user.id, action, entityType, entityId, newValues: {} });
	return { success: true };
}

export const actions = {
	async updateSettings(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const settings = JSON.parse(formData.get('settings'));

		for (const setting of settings) {
			const { error } = await client.from('footer_settings').update({ value: setting.value }).eq('id', setting.id);
			if (error) return fail(400, { message: error.message });
		}

		await logAudit(client, {
			userId: user.id,
			action: 'update_footer_settings',
			entityType: 'footer_settings',
			newValues: { count: settings.length }
		});

		return { success: true };
	},

	async createColumn(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const title = formData.get('title');
		const sort_order = parseInt(formData.get('sort_order') || '0');

		return runMutation(client, user, 'create_footer_column', 'footer_columns', null, () =>
			client.from('footer_columns').insert({ title, sort_order })
		);
	},

	async updateColumn(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');
		const title = formData.get('title');
		const is_visible = formData.get('is_visible') === 'true';

		return runMutation(client, user, 'update_footer_column', 'footer_columns', id, () =>
			client.from('footer_columns').update({ title, is_visible }).eq('id', id)
		);
	},

	async deleteColumn(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');

		return runMutation(client, user, 'delete_footer_column', 'footer_columns', id, () =>
			client.from('footer_columns').delete().eq('id', id)
		);
	},

	async createLink(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const column_id = formData.get('column_id');
		const label = formData.get('label');
		const url_path = formData.get('url');
		const is_external = formData.get('is_external') === 'true';
		const sort_order = parseInt(formData.get('sort_order') || '0');

		return runMutation(client, user, 'create_footer_link', 'footer_links', null, () =>
			client.from('footer_links').insert({ column_id, label, url: url_path, is_external, sort_order })
		);
	},

	async updateLink(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');
		const label = formData.get('label');
		const url_path = formData.get('url');
		const is_external = formData.get('is_external') === 'true';
		const is_visible = formData.get('is_visible') === 'true';

		return runMutation(client, user, 'update_footer_link', 'footer_links', id, () =>
			client.from('footer_links').update({ label, url: url_path, is_external, is_visible }).eq('id', id)
		);
	},

	async deleteLink(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');

		return runMutation(client, user, 'delete_footer_link', 'footer_links', id, () =>
			client.from('footer_links').delete().eq('id', id)
		);
	},

	async createSocialLink(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const platform = formData.get('platform');
		const label = formData.get('label');
		const url_path = formData.get('url');
		const icon_key = formData.get('icon_key') || 'link';
		const sort_order = parseInt(formData.get('sort_order') || '0');
		const is_visible = formData.get('is_visible') === 'true';

		return runMutation(client, user, 'create_footer_social', 'footer_social_links', null, () =>
			client.from('footer_social_links').insert({ platform, label, url: url_path, icon_key, sort_order, is_visible })
		);
	},

	async updateSocialLink(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');
		const platform = formData.get('platform');
		const label = formData.get('label');
		const url_path = formData.get('url');
		const icon_key = formData.get('icon_key');
		const is_visible = formData.get('is_visible') === 'true';

		return runMutation(client, user, 'update_footer_social', 'footer_social_links', id, () =>
			client.from('footer_social_links').update({ platform, label, url: url_path, icon_key, is_visible }).eq('id', id)
		);
	},

	async deleteSocialLink(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');

		return runMutation(client, user, 'delete_footer_social', 'footer_social_links', id, () =>
			client.from('footer_social_links').delete().eq('id', id)
		);
	}
};
