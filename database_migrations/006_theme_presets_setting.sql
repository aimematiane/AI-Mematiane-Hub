INSERT INTO public.site_settings (
	id,
	key,
	value,
	value_json,
	category,
	display_name,
	description,
	input_type,
	sort_order,
	is_public
) VALUES (
	'9fe8235b-dfe3-4ef7-a836-5f7e0be5d133',
	'theme_preset',
	'default',
	'{"options":[{"value":"default","label":"Default Dark Cyan"},{"value":"earth","label":"Earth Green"},{"value":"apple","label":"Apple Minimal"},{"value":"editorial","label":"Editorial Magazine"},{"value":"studio","label":"Warm Studio"}]}'::jsonb,
	'branding',
	'Theme Preset',
	'Changes the global color system for the whole website',
	'select',
	5,
	true
)
ON CONFLICT (id) DO UPDATE SET
	value_json = EXCLUDED.value_json,
	category = EXCLUDED.category,
	display_name = EXCLUDED.display_name,
	description = EXCLUDED.description,
	input_type = EXCLUDED.input_type,
	sort_order = EXCLUDED.sort_order,
	is_public = EXCLUDED.is_public;
