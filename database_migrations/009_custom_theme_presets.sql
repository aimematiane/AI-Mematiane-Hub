CREATE TABLE IF NOT EXISTS public.custom_theme_presets (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL,
	description TEXT,
	tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
	created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_custom_theme_presets_updated_at
	ON public.custom_theme_presets(updated_at DESC);

DROP TRIGGER IF EXISTS update_custom_theme_presets_updated_at ON public.custom_theme_presets;
CREATE TRIGGER update_custom_theme_presets_updated_at
	BEFORE UPDATE ON public.custom_theme_presets
	FOR EACH ROW
	EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.custom_theme_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_custom_theme_presets" ON public.custom_theme_presets;
CREATE POLICY "select_custom_theme_presets" ON public.custom_theme_presets
	FOR SELECT TO authenticated
	USING (public.is_admin());

DROP POLICY IF EXISTS "manage_custom_theme_presets" ON public.custom_theme_presets;
CREATE POLICY "manage_custom_theme_presets" ON public.custom_theme_presets
	FOR ALL TO authenticated
	USING (public.is_admin())
	WITH CHECK (public.is_admin());

INSERT INTO public.site_settings (key, value, category, display_name, description, input_type, sort_order, is_public)
VALUES
	('active_custom_theme_id', '', 'branding', 'Active Custom Theme ID', 'Internal reference for the active saved custom theme', 'text', 6, true),
	('active_custom_theme_name', '', 'branding', 'Active Custom Theme Name', 'Display name for the active saved custom theme', 'text', 7, true)
ON CONFLICT (key) DO NOTHING;
