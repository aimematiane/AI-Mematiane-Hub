-- Fix admin RLS: allow super_admin via is_admin() for management policies.

DROP POLICY IF EXISTS "manage_site_settings" ON public.site_settings;
CREATE POLICY "manage_site_settings" ON public.site_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "manage_theme_settings" ON public.theme_settings;
CREATE POLICY "manage_theme_settings" ON public.theme_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "manage_navigation_menus" ON public.navigation_menus;
CREATE POLICY "manage_navigation_menus" ON public.navigation_menus
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "manage_navigation_items" ON public.navigation_items;
CREATE POLICY "manage_navigation_items" ON public.navigation_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "manage_footer_settings" ON public.footer_settings;
CREATE POLICY "manage_footer_settings" ON public.footer_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "manage_footer_columns" ON public.footer_columns;
CREATE POLICY "manage_footer_columns" ON public.footer_columns
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "manage_footer_links" ON public.footer_links;
CREATE POLICY "manage_footer_links" ON public.footer_links
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "manage_footer_social_links" ON public.footer_social_links;
CREATE POLICY "manage_footer_social_links" ON public.footer_social_links
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "select_audit_logs" ON public.audit_logs;
CREATE POLICY "select_audit_logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "update_media_files" ON public.media_files;
CREATE POLICY "update_media_files" ON public.media_files
  FOR UPDATE TO authenticated
  USING (auth.uid() = uploaded_by OR public.is_admin())
  WITH CHECK (auth.uid() = uploaded_by OR public.is_admin());

DROP POLICY IF EXISTS "delete_media_files" ON public.media_files;
CREATE POLICY "delete_media_files" ON public.media_files
  FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by OR public.is_admin());
