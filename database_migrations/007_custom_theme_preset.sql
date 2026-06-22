UPDATE public.site_settings
SET
	value_json = '{"options":[{"value":"default","label":"Default Dark Cyan"},{"value":"earth","label":"Earth Green"},{"value":"apple","label":"Apple Minimal"},{"value":"editorial","label":"Editorial Magazine"},{"value":"studio","label":"Warm Studio"},{"value":"midnight","label":"Midnight Prism"},{"value":"aurora","label":"Aurora Signal"},{"value":"graphite","label":"Graphite Pro"},{"value":"custom","label":"Custom Unsaved"}]}'::jsonb,
	description = 'Changes the global color system for the whole website. Choose Custom to use Theme Builder colors and fonts.'
WHERE key = 'theme_preset';
