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

	const { data: users } = await client
		.from('profiles')
		.select('id, email, display_name, avatar_url, role, status, created_at, last_login_at')
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	const { data: roles } = await client
		.from('roles')
		.select('id, name, display_name, level, is_system')
		.order('level', { ascending: false });

	// Ensure we have roles loaded
	if (!roles || roles.length === 0) {
		// Return empty array if no roles exist (they should be seeded)
		return { users: users || [], roles: [] };
	}

	return { users: users || [], roles: roles || [] };
}

export const actions = {
	async updateStatus({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const id = formData.get('id');
		const status = formData.get('status');

		await client.from('profiles').update({ status }).eq('id', id);
		return { success: true };
	},

	async updateRole({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const id = formData.get('id');
		const role = formData.get('role');

		await client.from('profiles').update({ role }).eq('id', id);
		return { success: true };
	},

	async deleteUser({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const id = formData.get('id');

		// Soft delete
		await client.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', id);
		return { success: true };
	}
};
