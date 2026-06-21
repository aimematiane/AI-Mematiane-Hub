UPDATE public.site_settings
SET
	value = COALESCE(NULLIF(value, ''), 'default'),
	value_json = '{"options":[{"value":"default","label":"Default Dark Cyan"},{"value":"earth","label":"Earth Green"},{"value":"apple","label":"Apple Minimal"},{"value":"editorial","label":"Editorial Magazine"},{"value":"studio","label":"Warm Studio"}]}'::jsonb,
	category = 'branding',
	display_name = 'Theme Preset',
	description = 'Changes the global color system for the whole website',
	input_type = 'select',
	sort_order = 5,
	is_public = true
WHERE key = 'theme_preset';

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
)
SELECT
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
WHERE NOT EXISTS (
	SELECT 1 FROM public.site_settings WHERE key = 'theme_preset'
);
