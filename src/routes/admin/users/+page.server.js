import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { redirect } from '@sveltejs/kit';

// Helper function to check if user has specific permission
async function checkPermission(client, userId, permissionName) {
	const { data: profile } = await client
		.from('profiles')
		.select('role')
		.eq('id', userId)
		.single();

	if (!profile) return false;

	// Super admin has all permissions
	if (profile.role === 'super_admin') return true;

	// Get the role ID from the role name
	const { data: roleData } = await client
		.from('roles')
		.select('id')
		.eq('name', profile.role)
		.single();

	if (!roleData) return false;

	// Get the permission ID from the permission name
	const { data: permData } = await client
		.from('permissions')
		.select('id')
		.eq('name', permissionName)
		.single();

	if (!permData) return false;

	// Check if this role has this permission
	const { data: rpData } = await client
		.from('role_permissions')
		.select('id')
		.eq('role_id', roleData.id)
		.eq('permission_id', permData.id)
		.limit(1);

	return rpData && rpData.length > 0;
}

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

	if (!profile || profile.role === 'user') {
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
		const { data: { user } } = await client.auth.getUser();
		const formData = await request.formData();
		const id = formData.get('id');
		const status = formData.get('status');

		// Check permission
		const hasPermission = await checkPermission(client, user.id, 'users.manage_status');
		if (!hasPermission) {
			return { success: false, error: 'You do not have permission to manage user status' };
		}

		await client.from('profiles').update({ status }).eq('id', id);
		return { success: true };
	},

	async updateRole({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const { data: { user } } = await client.auth.getUser();
		const formData = await request.formData();
		const id = formData.get('id');
		const role = formData.get('role');

		// Check permission
		const hasPermission = await checkPermission(client, user.id, 'users.manage_roles');
		if (!hasPermission) {
			console.error(`Permission denied: User ${user.id} tried to manage roles`);
			return { success: false, error: 'You do not have permission to manage user roles' };
		}

		console.log(`Attempting to update role: userId=${id}, role=${role}`);

		const { data, error } = await client.from('profiles').update({ role }).eq('id', id);
		
		if (error) {
			console.error('Role update error:', error);
			return { success: false, error: error.message };
		}
		
		console.log(`Role updated successfully: ${id} -> ${role}`);
		return { success: true };
	},

	async deleteUser({ request, cookies, url }) {
		const client = await getSupabaseServerClient({ cookies, url });
		const { data: { user } } = await client.auth.getUser();
		const formData = await request.formData();
		const id = formData.get('id');

		// Check permission
		const hasPermission = await checkPermission(client, user.id, 'users.delete');
		if (!hasPermission) {
			return { success: false, error: 'You do not have permission to delete users' };
		}

		// Soft delete
		await client.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', id);
		return { success: true };
	}
};
