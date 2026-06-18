import { redirect } from '@sveltejs/kit';
import { getSupabaseServerClient } from '$lib/supabase/server.js';
import { isAdminRole } from '$lib/utils/roles.js';

export async function requireUser(event) {
	const client = await getSupabaseServerClient(event);
	const {
		data: { user },
		error
	} = await client.auth.getUser();

	if (error || !user) {
		throw redirect(302, '/auth/login');
	}

	return { client, user };
}

export async function requireAdmin(event, columns = 'id, email, display_name, avatar_url, role') {
	const { client, user } = await requireUser(event);
	const { data: profile, error } = await client
		.from('profiles')
		.select(columns)
		.eq('id', user.id)
		.single();

	if (error || !profile) {
		throw redirect(302, '/auth/login');
	}

	if (!isAdminRole(profile.role)) {
		throw redirect(302, '/profile');
	}

	return { client, user, profile };
}

export async function hasPermission(client, userId, permissionName) {
	const { data: profile } = await client
		.from('profiles')
		.select('role')
		.eq('id', userId)
		.single();

	if (!profile) return false;
	if (profile.role === 'super_admin') return true;
	if (!isAdminRole(profile.role)) return false;

	const { data: roleData } = await client
		.from('roles')
		.select('id')
		.eq('name', profile.role)
		.single();

	if (!roleData) return false;

	const { data: permData } = await client
		.from('permissions')
		.select('id')
		.eq('name', permissionName)
		.single();

	if (!permData) return false;

	const { data: rpData } = await client
		.from('role_permissions')
		.select('id')
		.eq('role_id', roleData.id)
		.eq('permission_id', permData.id)
		.limit(1);

	return Boolean(rpData?.length);
}
