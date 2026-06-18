export const ADMIN_ROLES = ['admin', 'super_admin'];

export function isAdminRole(role) {
	return ADMIN_ROLES.includes(role);
}
