import { getSupabaseServerClient } from '$lib/supabase/server.js';

export async function load({ cookies, url }) {
	const client = await getSupabaseServerClient({ cookies, url });

	let user = null;
	try {
		const { data, error } = await client.auth.getUser();
		if (!error) user = data.user;
	} catch (e) {
		// Gracefully handle invalid/expired refresh tokens
	}

	// Fetch published pages that are set to show in navbar
	const { data: navPages } = await client
		.from('pages')
		.select('id, title, slug')
		.eq('is_published', true)
		.eq('show_in_menu', true)
		.is('deleted_at', null)
		.order('created_at', { ascending: true });

	// Fetch footer data
	const [footerSettingsResult, footerColumnsResult, footerSocialResult] = await Promise.all([
		client.from('footer_settings').select('key, value').order('sort_order'),
		client.from('footer_columns')
			.select('id, title, sort_order, is_visible, links:footer_links(label, url, is_external, sort_order, is_visible)')
			.eq('is_visible', true)
			.order('sort_order'),
		client.from('footer_social_links')
			.select('id, platform, label, url, icon_key, sort_order')
			.eq('is_visible', true)
			.order('sort_order')
	]);

	// Convert settings array to object for easy access
	const footerSettingsMap = {};
	for (const s of footerSettingsResult.data || []) {
		footerSettingsMap[s.key] = s.value;
	}

	return {
		user,
		navPages: navPages || [],
		footer: {
			settings: footerSettingsMap,
			columns: footerColumnsResult.data || [],
			socialLinks: footerSocialResult.data || []
		}
	};
}
