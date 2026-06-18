import { hasPermission, requireAdmin } from '$lib/server/auth.js';

export async function load(event) {
	const { client } = await requireAdmin(event, 'role');

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
	async updateStatus(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');
		const status = formData.get('status');

		// Check permission
		if (!(await hasPermission(client, user.id, 'users.manage_status'))) {
			return { success: false, error: 'You do not have permission to manage user status' };
		}

		await client.from('profiles').update({ status }).eq('id', id);
		return { success: true };
	},

	async updateRole(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');
		const role = formData.get('role');

		// Check permission
		if (!(await hasPermission(client, user.id, 'users.manage_roles'))) {
			console.error(`Permission denied: User ${user.id} tried to manage roles`);
			return { success: false, error: 'You do not have permission to manage user roles' };
		}

		const { error } = await client.from('profiles').update({ role }).eq('id', id);
		
		if (error) {
			console.error('Role update error:', error);
			return { success: false, error: error.message };
		}
		return { success: true };
	},

	async deleteUser(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id');

		// Check permission
		if (!(await hasPermission(client, user.id, 'users.delete'))) {
			return { success: false, error: 'You do not have permission to delete users' };
		}

		// Soft delete
		await client.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', id);
		return { success: true };
	}
};
