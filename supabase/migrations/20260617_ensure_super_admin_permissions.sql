-- Ensure super_admin has all permissions
-- First, get the super_admin role ID and assign all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Verify the assignment
SELECT COUNT(*) as super_admin_permissions 
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'super_admin';
