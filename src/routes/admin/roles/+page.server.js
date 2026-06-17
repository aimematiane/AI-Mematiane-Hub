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

	const { data: roles } = await client
		.from('roles')
		.select('*')
		.order('level', { ascending: false });

	const { data: permissions } = await client
		.from('permissions')
		.select('*')
		.order('module')
		.order('action');

	const { data: role_permissions } = await client
		.from('role_permissions')
		.select('role_id, permission_id');

	// Group permissions by module
	const permissionsByModule = {};
	for (const p of permissions || []) {
		if (!permissionsByModule[p.module]) permissionsByModule[p.module] = [];
		permissionsByModule[p.module].push(p);
	}

	return {
		roles: roles || [],
		permissions: permissions || [],
		permissionsByModule,
		role_permissions: role_permissions || []
	};
}

export const actions = {
	async createRole({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const name = formData.get('name').toLowerCase().replace(/\s+/g, '_');
		const display_name = formData.get('display_name');
		const level = parseInt(formData.get('level') || '0');
		const description = formData.get('description');

		await client.from('roles').insert({ name, display_name, level, description });
		return { success: true };
	},

	async updatePermissions({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const formData = await request.formData();
		const roleId = formData.get('role_id');
		const permissionsJson = formData.get('permissions');
		const permissions = JSON.parse(permissionsJson);

		// Delete existing permissions
		await client.from('role_permissions').delete().eq('role_id', roleId);

		// Insert new permissions
		for (const permId of permissions) {
			await client.from('role_permissions').insert({ role_id: roleId, permission_id: permId });
		}

		return { success: true };
	}
};
