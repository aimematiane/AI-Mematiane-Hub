import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ cookies, url }) {
	const client = await getSupabaseServerClient({ cookies, url });
	const isAdminRoute = url.pathname.startsWith('/admin');

	let user = null;
	let profile = null;
	try {
		const { data, error } = await client.auth.getUser();
		if (!error) user = data.user;
	} catch {
		// Gracefully handle invalid/expired refresh tokens
	}

	if (user) {
		const { data: profileData } = await client
			.from('profiles')
			.select('role, display_name')
			.eq('id', user.id)
			.single();
		profile = profileData;
	}

	const { data: navPages } = await client
		.from('pages')
		.select('id, title, slug')
		.eq('is_published', true)
		.eq('show_in_menu', true)
		.is('deleted_at', null)
		.order('created_at', { ascending: true });

	// Admin routes skip heavy global chrome data — admin has its own layout
	if (isAdminRoute) {
		return {
			user,
			profile,
			navPages: navPages || [],
			footer: { settings: {}, columns: [], socialLinks: [] },
			theme: {}
		};
	}

	const [footerSettingsResult, footerColumnsResult, footerSocialResult, themeSettingsResult] = await Promise.all([
		client.from('footer_settings').select('key, value').order('sort_order'),
		client.from('footer_columns')
			.select('id, title, sort_order, is_visible, links:footer_links(label, url, is_external, sort_order, is_visible)')
			.eq('is_visible', true)
			.order('sort_order'),
		client.from('footer_social_links')
			.select('id, platform, label, url, icon_key, sort_order')
			.eq('is_visible', true)
			.order('sort_order'),
		client.from('theme_settings')
			.select('css_variable, value')
			.not('css_variable', 'is', null)
	]);

	const footerSettingsMap = {};
	for (const s of footerSettingsResult.data || []) {
		footerSettingsMap[s.key] = s.value;
	}

	const themeCssVars = {};
	for (const setting of themeSettingsResult.data || []) {
		if (setting.css_variable && setting.value) {
			themeCssVars[setting.css_variable] = setting.value;
		}
	}

	return {
		user,
		profile,
		navPages: navPages || [],
		footer: {
			settings: footerSettingsMap,
			columns: footerColumnsResult.data || [],
			socialLinks: footerSocialResult.data || []
		},
		theme: themeCssVars
	};
}
