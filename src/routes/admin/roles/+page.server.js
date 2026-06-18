import { requireAdmin } from '$lib/server/auth.js';

export async function load(event) {
	const { client } = await requireAdmin(event, 'role');

	const { data: roles, error: rolesError } = await client
		.from('roles')
		.select('*')
		.order('level', { ascending: false });

	if (rolesError) {
		console.error('Roles fetch error:', rolesError);
	}

	const { data: permissions, error: permsError } = await client
		.from('permissions')
		.select('*');

	if (permsError) {
		console.error('Permissions fetch error:', permsError);
	}

	const { data: role_permissions, error: rpError } = await client
		.from('role_permissions')
		.select('role_id, permission_id');

	if (rpError) {
		console.error('Role permissions fetch error:', rpError);
	}


	// Group permissions by module
	const permissionsByModule = {};
	for (const p of permissions || []) {
		if (!permissionsByModule[p.module]) permissionsByModule[p.module] = [];
		permissionsByModule[p.module].push(p);
	}

	return {
		roles: Array.isArray(roles) ? roles : [],
		permissions: Array.isArray(permissions) ? permissions : [],
		permissionsByModule,
		role_permissions: Array.isArray(role_permissions) ? role_permissions : []
	};
}

export const actions = {
	async createRole(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const name = formData.get('name');
		const display_name = formData.get('display_name');
		const level = parseInt(formData.get('level') || '0');
		const description = formData.get('description') || '';

		if (!name || !display_name) {
			return { success: false, error: 'Name and display_name are required' };
		}

		const { error } = await client.from('roles').insert({ 
			name, 
			display_name, 
			level, 
			description,
			is_system: false 
		});

		if (error) {
			console.error('Role creation error:', error);
			// Check if it's a duplicate key error
			if (error.code === '23505') {
				return { success: false, error: `Role key "${name}" already exists` };
			}
			return { success: false, error: error.message || 'Failed to create role' };
		}

		return { success: true };
	},

	async updatePermissions(event) {
		const { request } = event;
		const { client } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const roleId = formData.get('role_id');
		const permissionsJson = formData.get('permissions');
		const permissions = JSON.parse(permissionsJson || '[]');

		// Delete existing permissions
		const { error: deleteError } = await client.from('role_permissions').delete().eq('role_id', roleId);
		if (deleteError) {
			console.error('Error deleting permissions:', deleteError);
			return { success: false, error: 'Failed to delete existing permissions' };
		}

		// Insert new permissions
		if (permissions.length > 0) {
			const insertData = permissions.map(permId => ({ role_id: roleId, permission_id: permId }));
			const { error: insertError } = await client.from('role_permissions').insert(insertData);
			if (insertError) {
				console.error('Error inserting permissions:', insertError);
				return { success: false, error: 'Failed to save permissions' };
			}
		}

		return { success: true };
	}
};
