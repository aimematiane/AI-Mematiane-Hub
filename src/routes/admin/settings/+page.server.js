import { requireAdmin, requirePermission } from '$lib/server/auth.js';
import { logAudit } from '$lib/server/audit.js';
import { fail } from '@sveltejs/kit';

export async function load(event) {
	const { client } = await requirePermission(event, 'site_settings.view');

	const [settingsResult, themeSettingsResult, customThemesResult] = await Promise.all([
		client
			.from('site_settings')
			.select('*')
			.order('category')
			.order('sort_order'),
		client
			.from('theme_settings')
			.select('id, key, value, css_variable, category, display_name, sort_order')
			.order('category')
			.order('sort_order'),
		client
			.from('custom_theme_presets')
			.select('*')
			.order('updated_at', { ascending: false })
	]);

	const settings = settingsResult.data || [];
	const themeSettings = themeSettingsResult.data || [];
	const customThemes = customThemesResult.data || [];

	const categories = [...new Set(settings?.map(s => s.category) || [])];

	return {
		settings,
		themeSettings,
		customThemes,
		categories
	};
}

function settingPayload(key, value, displayName) {
	return {
		key,
		value,
		category: 'branding',
		display_name: displayName,
		input_type: 'text',
		sort_order: 6,
		is_public: true
	};
}

async function updateActiveCustomTheme(client, id, name) {
	const rows = [
		settingPayload('active_custom_theme_id', id || '', 'Active Custom Theme ID'),
		settingPayload('active_custom_theme_name', name || '', 'Active Custom Theme Name')
	];

	const { error } = await client
		.from('site_settings')
		.upsert(rows, { onConflict: 'key' });

	return error;
}

async function applyThemeTokens(client, tokens = {}) {
	for (const [key, value] of Object.entries(tokens)) {
		const { error } = await client
			.from('theme_settings')
			.update({ value })
			.eq('key', key);
		if (error) return error;
	}
	return null;
}

export const actions = {
	async update(event) {
		const { request } = event;
		const { client, user } = await requirePermission(event, 'site_settings.edit');
		const formData = await request.formData();
		const settingsJson = formData.get('settings');
		const themeSettingsJson = formData.get('themeSettings');
		const settings = JSON.parse(settingsJson);
		const themeSettings = themeSettingsJson ? JSON.parse(themeSettingsJson) : [];

		for (const setting of settings) {
			const payload = { value: setting.value };
			if (setting.value_json !== undefined && setting.value_json !== null) {
				payload.value_json = setting.value_json;
			}

			const { error } = await client.from('site_settings').update(payload).eq('id', setting.id);
			if (error) return fail(400, { message: error.message });
		}

		for (const setting of themeSettings) {
			if (!setting.id) continue;

			const { error } = await client
				.from('theme_settings')
				.update({ value: setting.value })
				.eq('id', setting.id);
			if (error) return fail(400, { message: error.message });
		}

		await logAudit(client, {
			userId: user.id,
			action: 'update_settings',
			entityType: 'site_settings',
			newValues: { count: settings.length, themeCount: themeSettings.length }
		});

		return { success: true };
	},

	async saveCustomTheme(event) {
		const { request } = event;
		const { client, user } = await requirePermission(event, 'site_settings.edit');
		const formData = await request.formData();
		const id = formData.get('id') || null;
		const name = String(formData.get('name') || '').trim();
		const description = String(formData.get('description') || '').trim();
		const tokens = JSON.parse(formData.get('tokens') || '{}');
		const applyNow = formData.get('applyNow') === 'true';

		if (!name) return fail(400, { message: 'Theme name is required.' });
		if (!Object.keys(tokens).length) return fail(400, { message: 'Theme tokens are empty.' });

		const payload = {
			name,
			description,
			tokens,
			updated_at: new Date().toISOString()
		};

		let result;
		if (id) {
			result = await client
				.from('custom_theme_presets')
				.update(payload)
				.eq('id', id)
				.select()
				.single();
		} else {
			result = await client
				.from('custom_theme_presets')
				.insert({ ...payload, created_by: user.id })
				.select()
				.single();
		}

		if (result.error) return fail(400, { message: result.error.message });

		if (applyNow) {
			const tokenError = await applyThemeTokens(client, tokens);
			if (tokenError) return fail(400, { message: tokenError.message });
			const activeError = await updateActiveCustomTheme(client, result.data.id, name);
			if (activeError) return fail(400, { message: activeError.message });
		}

		await logAudit(client, {
			userId: user.id,
			action: id ? 'update_custom_theme' : 'create_custom_theme',
			entityType: 'custom_theme_presets',
			entityId: result.data.id,
			newValues: { name, applyNow }
		});

		return { success: true, theme: result.data };
	},

	async applyCustomTheme(event) {
		const { request } = event;
		const { client, user } = await requirePermission(event, 'site_settings.edit');
		const formData = await request.formData();
		const id = formData.get('id');

		const { data: theme, error } = await client
			.from('custom_theme_presets')
			.select('*')
			.eq('id', id)
			.single();
		if (error) return fail(400, { message: error.message });

		const tokenError = await applyThemeTokens(client, theme.tokens || {});
		if (tokenError) return fail(400, { message: tokenError.message });

		const activeError = await updateActiveCustomTheme(client, theme.id, theme.name);
		if (activeError) return fail(400, { message: activeError.message });

		await logAudit(client, {
			userId: user.id,
			action: 'apply_custom_theme',
			entityType: 'custom_theme_presets',
			entityId: theme.id,
			newValues: { name: theme.name }
		});

		return { success: true };
	},

	async deleteCustomTheme(event) {
		const { request } = event;
		const { client, user } = await requirePermission(event, 'site_settings.edit');
		const formData = await request.formData();
		const id = formData.get('id');
		const activeId = formData.get('activeId');

		const { error } = await client
			.from('custom_theme_presets')
			.delete()
			.eq('id', id);
		if (error) return fail(400, { message: error.message });

		if (id && id === activeId) {
			const activeError = await updateActiveCustomTheme(client, '', '');
			if (activeError) return fail(400, { message: activeError.message });
		}

		await logAudit(client, {
			userId: user.id,
			action: 'delete_custom_theme',
			entityType: 'custom_theme_presets',
			entityId: id,
			newValues: {}
		});

		return { success: true };
	}
};
