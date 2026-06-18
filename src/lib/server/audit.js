/**
 * Write an audit log entry (best-effort — never throws).
 */
export async function logAudit(client, { userId, action, entityType, entityId = null, newValues = {}, oldValues = null }) {
	try {
		const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		const safeEntityId = entityId && uuidRe.test(String(entityId)) ? entityId : null;

		await client.from('audit_logs').insert({
			user_id: userId,
			action,
			entity_type: entityType,
			entity_id: safeEntityId,
			new_values: newValues,
			old_values: oldValues
		});
	} catch {
		// Audit logging must not break admin operations
	}
}
