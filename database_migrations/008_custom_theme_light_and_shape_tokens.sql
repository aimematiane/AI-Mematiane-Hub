INSERT INTO public.theme_settings (id, key, value, category, display_name, css_variable, sort_order) VALUES
('2e9d6e72-3c33-4a3e-9f9d-61a3643f7341', 'color_light_bg_primary', '#ffffff', 'colors', 'Light Page Background', '--light-bg-primary', 80),
('55b34ad6-8fc6-4985-b4c9-bd2ee2ac2386', 'color_light_bg_secondary', '#f8fafc', 'colors', 'Light Panel Background', '--light-bg-secondary', 81),
('559a5bea-2802-41bd-9db5-081ab016cbda', 'color_light_bg_tertiary', '#d1d5db', 'colors', 'Light Border Surface', '--light-bg-tertiary', 82),
('e70813c3-3e73-49d8-a245-28b0c9602b96', 'color_light_text_primary', '#0f172a', 'colors', 'Light Text Primary', '--light-text-primary', 83),
('a60d994b-6f38-4f83-af7d-83ed1d176e76', 'color_light_text_secondary', '#334155', 'colors', 'Light Text Secondary', '--light-text-secondary', 84),
('beca2a5f-b1c6-4f3f-b3c5-282a736e8453', 'color_light_text_muted', '#64748b', 'colors', 'Light Text Muted', '--light-text-muted', 85)
ON CONFLICT (id) DO NOTHING;
