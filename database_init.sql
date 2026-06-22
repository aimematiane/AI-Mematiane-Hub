-- =====================================================
-- COMPLETE DATABASE INITIALIZATION
-- This file creates the entire database schema from scratch
-- Run this on a fresh Supabase project to set everything up
-- =====================================================

-- =====================================================
-- SECTION 1: FUNCTIONS
-- =====================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'user_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    'user'
  );
  RETURN NEW;
END;
$$;

-- =====================================================
-- SECTION 2: TABLES
-- =====================================================

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  bio TEXT,
  website_url TEXT,
  social_links JSONB DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'pending')),
  deleted_at TIMESTAMPTZ
);

-- AI Tools table
CREATE TABLE public.ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  long_description TEXT,
  category TEXT NOT NULL CHECK (category IN ('text', 'image', 'video', 'audio', 'code', 'data', 'other')),
  image_url TEXT,
  website_url TEXT,
  demo_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  github_url TEXT,
  paper_url TEXT,
  pricing TEXT DEFAULT 'free',
  attachments TEXT[] DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  meta_title TEXT,
  meta_description TEXT
);

-- Posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES public.profiles(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attachments TEXT[] DEFAULT '{}',
  references_links TEXT[] DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  meta_title TEXT,
  meta_description TEXT
);

-- News table
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  source_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES public.profiles(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attachments TEXT[] DEFAULT '{}',
  references_links TEXT[] DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  meta_title TEXT,
  meta_description TEXT
);

-- Bookmarks table
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('post', 'news', 'ai_tool')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Upvotes table
CREATE TABLE public.upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('post', 'news', 'ai_tool')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('post', 'news', 'ai_tool')),
  item_id UUID NOT NULL,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.get_content_metrics(p_item_type TEXT, p_item_ids UUID[])
RETURNS TABLE (
  item_id UUID,
  upvotes_count BIGINT,
  bookmarks_count BIGINT,
  comments_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ids.item_id,
    COALESCE(upvote_counts.count, 0) AS upvotes_count,
    COALESCE(bookmark_counts.count, 0) AS bookmarks_count,
    COALESCE(comment_counts.count, 0) AS comments_count
  FROM unnest(p_item_ids) AS ids(item_id)
  LEFT JOIN (
    SELECT item_id, COUNT(*) AS count
    FROM public.upvotes
    WHERE item_type = p_item_type AND item_id = ANY(p_item_ids)
    GROUP BY item_id
  ) upvote_counts ON upvote_counts.item_id = ids.item_id
  LEFT JOIN (
    SELECT item_id, COUNT(*) AS count
    FROM public.bookmarks
    WHERE item_type = p_item_type AND item_id = ANY(p_item_ids)
    GROUP BY item_id
  ) bookmark_counts ON bookmark_counts.item_id = ids.item_id
  LEFT JOIN (
    SELECT item_id, COUNT(*) AS count
    FROM public.reviews
    WHERE item_type = p_item_type AND item_id = ANY(p_item_ids)
    GROUP BY item_id
  ) comment_counts ON comment_counts.item_id = ids.item_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_content_metrics(TEXT, UUID[]) TO anon, authenticated;

-- Roles table (RBAC)
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permissions table (RBAC)
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Role-Permission mappings (RBAC)
CREATE TABLE public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Site Settings table (CMS)
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  value_json JSONB,
  category TEXT NOT NULL DEFAULT 'general',
  display_name TEXT NOT NULL,
  description TEXT,
  input_type TEXT NOT NULL DEFAULT 'text' CHECK (input_type IN ('text', 'textarea', 'rich_text', 'image', 'color', 'url', 'email', 'number', 'boolean', 'json', 'select')),
  options JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Theme Settings table (CMS)
CREATE TABLE public.theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  category TEXT NOT NULL DEFAULT 'colors',
  display_name TEXT NOT NULL,
  description TEXT,
  css_variable TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Custom Theme Presets table (CMS)
CREATE TABLE public.custom_theme_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Navigation Menus table (CMS)
CREATE TABLE public.navigation_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL CHECK (location IN ('header', 'footer', 'sidebar', 'mobile')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Navigation Items table (CMS)
CREATE TABLE public.navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.navigation_menus(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.navigation_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  is_external BOOLEAN NOT NULL DEFAULT false,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT false,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  css_class TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pages table (CMS)
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  featured_image_url TEXT,
  content TEXT,
  sections JSONB DEFAULT '[]',
  is_published BOOLEAN NOT NULL DEFAULT false,
  show_in_menu BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES public.profiles(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Footer Settings table (CMS)
CREATE TABLE public.footer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  value_json JSONB,
  category TEXT NOT NULL DEFAULT 'general',
  display_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Footer Columns table (CMS)
CREATE TABLE public.footer_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Footer Links table (CMS)
CREATE TABLE public.footer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES public.footer_columns(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  is_external BOOLEAN NOT NULL DEFAULT false,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Footer Social Links table (CMS)
CREATE TABLE public.footer_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_key TEXT NOT NULL DEFAULT 'link',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Media Files table
CREATE TABLE public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  folder TEXT DEFAULT '/',
  uploaded_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Audit Logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- SECTION 3: INDEXES
-- =====================================================

-- AI Tools indexes
CREATE INDEX idx_ai_tools_category ON public.ai_tools(category);
CREATE INDEX idx_ai_tools_deleted ON public.ai_tools(deleted_at);
CREATE INDEX idx_ai_tools_slug ON public.ai_tools(slug);

-- Posts indexes
CREATE INDEX idx_posts_deleted ON public.posts(deleted_at);
CREATE INDEX idx_posts_published ON public.posts(is_published, published_at DESC);
CREATE INDEX idx_posts_slug ON public.posts(slug);

-- News indexes
CREATE INDEX idx_news_deleted ON public.news(deleted_at);
CREATE INDEX idx_news_published ON public.news(is_published, published_at DESC);
CREATE INDEX idx_news_slug ON public.news(slug);

-- Pages indexes
CREATE INDEX idx_pages_deleted ON public.pages(deleted_at);
CREATE INDEX idx_pages_published ON public.pages(is_published, published_at DESC);
CREATE INDEX idx_pages_slug ON public.pages(slug);

-- Profiles indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_status ON public.profiles(status);

-- Bookmarks indexes
CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id);

-- Upvotes indexes
CREATE INDEX idx_upvotes_item ON public.upvotes(item_type, item_id);

-- Reviews indexes
CREATE INDEX idx_reviews_item ON public.reviews(item_type, item_id);

-- Roles index
CREATE INDEX idx_roles_level ON public.roles(level);

-- Permissions index
CREATE INDEX idx_permissions_module ON public.permissions(module);

-- Site Settings indexes
CREATE INDEX idx_site_settings_category ON public.site_settings(category);
CREATE INDEX idx_site_settings_key ON public.site_settings(key);

-- Theme Settings indexes
CREATE INDEX idx_theme_settings_category ON public.theme_settings(category);
CREATE INDEX idx_theme_settings_key ON public.theme_settings(key);
CREATE INDEX idx_custom_theme_presets_updated_at ON public.custom_theme_presets(updated_at DESC);

-- Navigation indexes
CREATE INDEX idx_navigation_items_menu ON public.navigation_items(menu_id);
CREATE INDEX idx_navigation_items_parent ON public.navigation_items(parent_id);
CREATE INDEX idx_navigation_items_sort ON public.navigation_items(menu_id, sort_order);

-- Footer indexes
CREATE INDEX idx_footer_social_links_sort ON public.footer_social_links(sort_order);

-- Media Files indexes
CREATE INDEX idx_media_files_deleted ON public.media_files(deleted_at);
CREATE INDEX idx_media_files_folder ON public.media_files(folder);
CREATE INDEX idx_media_files_uploaded_by ON public.media_files(uploaded_by);

-- Audit Logs indexes
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);

-- =====================================================
-- SECTION 4: TRIGGERS
-- =====================================================

-- Auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_theme_settings_updated_at
  BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_custom_theme_presets_updated_at
  BEFORE UPDATE ON public.custom_theme_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_navigation_menus_updated_at
  BEFORE UPDATE ON public.navigation_menus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_navigation_items_updated_at
  BEFORE UPDATE ON public.navigation_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_footer_settings_updated_at
  BEFORE UPDATE ON public.footer_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_footer_columns_updated_at
  BEFORE UPDATE ON public.footer_columns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_footer_links_updated_at
  BEFORE UPDATE ON public.footer_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_footer_social_links_updated_at
  BEFORE UPDATE ON public.footer_social_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_media_files_updated_at
  BEFORE UPDATE ON public.media_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- SECTION 5: ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_theme_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 6: RLS POLICIES
-- =====================================================

-- Profiles
CREATE POLICY "select_profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_own_profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_profile_policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR is_admin()) WITH CHECK (auth.uid() = id OR is_admin());

-- AI Tools
CREATE POLICY "select_ai_tools" ON public.ai_tools FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_ai_tools" ON public.ai_tools FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user'));
CREATE POLICY "update_ai_tools" ON public.ai_tools FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user'));
CREATE POLICY "delete_ai_tools" ON public.ai_tools FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user'));

-- Posts
CREATE POLICY "select_published_posts" ON public.posts FOR SELECT TO anon, authenticated USING (is_published = true OR author_id = auth.uid());
CREATE POLICY "insert_posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user'));
CREATE POLICY "update_posts" ON public.posts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user'));
CREATE POLICY "delete_posts" ON public.posts FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user'));

-- News
CREATE POLICY "select_published_news" ON public.news FOR SELECT TO anon, authenticated USING (is_published = true OR author_id = auth.uid());
CREATE POLICY "insert_news" ON public.news FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user'));
CREATE POLICY "update_news" ON public.news FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user'));
CREATE POLICY "delete_news" ON public.news FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user'));

-- Bookmarks
CREATE POLICY "select_own_bookmarks" ON public.bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_bookmarks" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_bookmarks" ON public.bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Upvotes
CREATE POLICY "select_upvotes" ON public.upvotes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_own_upvotes" ON public.upvotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_upvotes" ON public.upvotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reviews
CREATE POLICY "select_reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_own_reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Roles, Permissions, Role Permissions (admin only)
CREATE POLICY "manage_roles" ON public.roles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "manage_permissions" ON public.permissions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "select_role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "manage_role_permissions" ON public.role_permissions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Site Settings
CREATE POLICY "select_public_site_settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "manage_site_settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Theme Settings
CREATE POLICY "select_theme_settings" ON public.theme_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "manage_theme_settings" ON public.theme_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Custom Theme Presets
CREATE POLICY "select_custom_theme_presets" ON public.custom_theme_presets FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "manage_custom_theme_presets" ON public.custom_theme_presets FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Navigation
CREATE POLICY "select_navigation_menus" ON public.navigation_menus FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "manage_navigation_menus" ON public.navigation_menus FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "select_navigation_items" ON public.navigation_items FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM navigation_menus WHERE navigation_menus.id = navigation_items.menu_id AND navigation_menus.is_active = true));
CREATE POLICY "manage_navigation_items" ON public.navigation_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Pages
CREATE POLICY "select_published_pages" ON public.pages
  FOR SELECT TO anon
  USING (
    deleted_at IS NULL
    AND is_published = true
  );

CREATE POLICY "select_own_or_admin_pages" ON public.pages
  FOR SELECT TO authenticated
  USING (
    (deleted_at IS NULL AND is_published = true)
    OR author_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "manage_pages" ON public.pages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') OR author_id = auth.uid());

-- Footer
CREATE POLICY "select_footer_settings" ON public.footer_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "manage_footer_settings" ON public.footer_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "select_footer_columns" ON public.footer_columns FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "manage_footer_columns" ON public.footer_columns FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "select_footer_links" ON public.footer_links FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "manage_footer_links" ON public.footer_links FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "select_footer_social_links" ON public.footer_social_links FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "manage_footer_social_links" ON public.footer_social_links FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Media Files
CREATE POLICY "select_media_files" ON public.media_files FOR SELECT TO anon, authenticated USING (deleted_at IS NULL OR auth.uid() = uploaded_by OR public.is_admin());
CREATE POLICY "insert_media_files" ON public.media_files FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "update_media_files" ON public.media_files FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by OR public.is_admin()) WITH CHECK (auth.uid() = uploaded_by OR public.is_admin());
CREATE POLICY "delete_media_files" ON public.media_files FOR DELETE TO authenticated USING (auth.uid() = uploaded_by OR public.is_admin());


-- Audit Logs
CREATE POLICY "select_audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "insert_audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- =====================================================
-- SECTION 7: STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('uploads', 'uploads', true, 10485760, ARRAY['image/*', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for general uploads
CREATE POLICY "Allow public select from uploads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'uploads');
CREATE POLICY "Allow staff insert to uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads' AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user'));
CREATE POLICY "Allow staff update to uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'uploads' AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user')) WITH CHECK (bucket_id = 'uploads' AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user'));
CREATE POLICY "Allow staff delete from uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads' AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user'));

-- Profile images folder policies
CREATE POLICY "Users can upload profile images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads' AND (storage.foldername(name))[1] = 'profile-images' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "Users can view only their own profile images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = 'profile-images' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "Users can update only their own profile images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = 'profile-images' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "Users can delete only their own profile images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = 'profile-images' AND (storage.foldername(name))[2] = auth.uid()::text);

-- =====================================================
-- SECTION 8: SEED DATA - ROLES & PERMISSIONS
-- =====================================================

INSERT INTO public.roles (id, name, display_name, description, is_system, level) VALUES
('96caadf9-13cd-409c-8024-944316873e18', 'super_admin', 'Super Admin', 'Full system access with all permissions', true, 100),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', 'admin', 'Administrator', 'Full administrative access', true, 80),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', 'editor', 'Editor', 'Can create and edit content', true, 60),
('aad5d25b-2015-413c-800f-4c6d29ece6df', 'moderator', 'Moderator', 'Can moderate user content', true, 40),
('709193ef-afad-4162-910f-0cccf38d2097', 'content_manager', 'Content Manager', 'Manages blog posts and news articles', false, 30),
('f727bbe4-b519-4185-ae35-6729a84d736e', 'author', 'Author', 'Can create own content', true, 20),
('e3f4949a-55d3-48e5-b61c-177ca04b2054', 'user', 'User', 'Basic user access', true, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.permissions (id, name, display_name, module, action, description) VALUES
('29800588-ec53-439d-bf10-23b244c6fbb6', 'ai_tools.create', 'Create AI Tools', 'ai_tools', 'create', 'Create AI tool entries'),
('5ba4aa5c-8b25-46fa-82e2-2f463f632646', 'ai_tools.delete', 'Delete AI Tools', 'ai_tools', 'delete', 'Delete AI tools'),
('23dafb6e-571a-4acc-867e-29913527d7d3', 'ai_tools.edit', 'Edit AI Tools', 'ai_tools', 'edit', 'Edit any AI tool'),
('83e83e2e-b040-4e7d-a8c8-cc26c6b573f0', 'ai_tools.view', 'View AI Tools', 'ai_tools', 'view', 'View all AI tools'),
('3769cf11-3913-4ebc-9edf-88f61691c38b', 'audit.view', 'View Audit Logs', 'audit', 'view', 'View audit logs'),
('d1279d4a-4109-45b9-b758-6fd8222008c3', 'footer.edit', 'Edit Footer', 'footer', 'edit', 'Edit footer settings'),
('f4b1bb77-c11e-4257-bae9-318bf170d3c0', 'footer.view', 'View Footer', 'footer', 'view', 'View footer settings'),
('28807f3b-f202-47da-8bca-c5755af8dd63', 'media.delete', 'Delete Media', 'media', 'delete', 'Delete media files'),
('2a29c009-e742-43b7-b18e-6c2ace376280', 'media.edit', 'Edit Media', 'media', 'edit', 'Edit media files'),
('ffd639fa-2b3a-4213-87df-21f70e7b9e7a', 'media.upload', 'Upload Media', 'media', 'upload', 'Upload new media'),
('4f18b8a9-c373-4ad9-befb-1d6cf9a3f9a8', 'media.view', 'View Media', 'media', 'view', 'View media library'),
('34fbf0b2-e00b-4f29-af8f-fde9e48bc598', 'navigation.edit', 'Edit Navigation', 'navigation', 'edit', 'Edit navigation menus'),
('ee4d0104-4159-4c70-9ca1-20fe0cac1c66', 'navigation.view', 'View Navigation', 'navigation', 'view', 'View navigation menus'),
('1cf326fc-d99c-405b-9a88-3506f93edac3', 'news.create', 'Create News', 'news', 'create', 'Create news articles'),
('05e8a07e-d09d-4a87-baee-51192db2433b', 'news.delete', 'Delete News', 'news', 'delete', 'Delete news articles'),
('e5a13514-1f92-44b9-afb6-e2b040fdeb2d', 'news.edit', 'Edit News', 'news', 'edit', 'Edit any news article'),
('cfc79604-39bc-433a-ab06-2f40ec6fdec6', 'news.publish', 'Publish News', 'news', 'publish', 'Publish news'),
('05e3205c-837f-4032-939c-686e5cb788b4', 'news.view', 'View News', 'news', 'view', 'View all news'),
('5f349aed-a18f-452e-b916-07d447cd30b5', 'pages.create', 'Create Pages', 'pages', 'create', 'Create new pages'),
('76eca5df-8987-4f04-915c-281ac99071c3', 'pages.delete', 'Delete Pages', 'pages', 'delete', 'Delete pages'),
('b3969b2e-7828-45c4-8e21-15dd1c70e831', 'pages.edit', 'Edit Pages', 'pages', 'edit', 'Edit existing pages'),
('4c451a17-dd97-40ad-91cb-f44709da157d', 'pages.publish', 'Publish Pages', 'pages', 'publish', 'Publish pages'),
('229b5716-91fd-498a-be56-4c5f7d8ee12b', 'pages.view', 'View Pages', 'pages', 'view', 'View all pages'),
('29d96959-dace-4e4e-8b0c-7bdf66f9e515', 'posts.create', 'Create Posts', 'posts', 'create', 'Create new posts'),
('830c4a89-0c0e-45ad-8154-16fb19cec72e', 'posts.delete', 'Delete Posts', 'posts', 'delete', 'Delete any post'),
('3204f7e0-ff40-4d17-9039-2e293ea3c135', 'posts.edit', 'Edit Posts', 'posts', 'edit', 'Edit any post'),
('5fa226a8-9fab-4d02-a400-9e6ce2215eef', 'posts.publish', 'Publish Posts', 'posts', 'publish', 'Publish posts'),
('1d487a6b-b2d0-42b1-aafe-24e56c1500a9', 'posts.view', 'View Posts', 'posts', 'view', 'View all posts'),
('4d53b2a8-ae32-4c7b-829f-87015a74a28e', 'seo.edit', 'Edit SEO', 'seo', 'edit', 'Edit SEO settings'),
('e3d4f910-b537-42bd-b9b6-7e39a6d2263b', 'seo.view', 'View SEO', 'seo', 'view', 'View SEO settings'),
('c47f46d5-18c2-4a14-a258-2de363f1a2d2', 'site_settings.edit', 'Edit Site Settings', 'site_settings', 'edit', 'Edit site settings'),
('aa3baddf-e4d4-4854-b27a-0be95212bb99', 'site_settings.view', 'View Site Settings', 'site_settings', 'view', 'View site settings'),
('02f9f26a-694a-42aa-9143-c53456f43b21', 'taxonomy.edit', 'Edit Taxonomy', 'taxonomy', 'edit', 'Manage categories and tags'),
('b1b6025a-db18-4cc7-a3bd-4b05d7129eaf', 'taxonomy.view', 'View Taxonomy', 'taxonomy', 'view', 'View categories and tags'),
('fe296719-75af-4145-b56c-e2be6388e138', 'users.delete', 'Delete Users', 'users', 'delete', 'Delete users'),
('1f96ea79-5f45-4d8b-984b-919a63d939ec', 'users.edit', 'Edit Users', 'users', 'edit', 'Edit user profiles'),
('34938a20-09e6-4764-acb4-4608b4538daf', 'users.manage_roles', 'Manage User Roles', 'users', 'manage_roles', 'Assign roles to users'),
('ff526172-2f60-4485-ad57-68b2236de446', 'users.manage_status', 'Manage User Status', 'users', 'manage_status', 'Change user status'),
('080b354f-26ff-4989-9db2-316419706812', 'users.view', 'View Users', 'users', 'view', 'View user profiles')
ON CONFLICT (id) DO NOTHING;

-- Role-Permission mappings
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
-- super_admin: all 39 permissions
('96caadf9-13cd-409c-8024-944316873e18', '29800588-ec53-439d-bf10-23b244c6fbb6'),
('96caadf9-13cd-409c-8024-944316873e18', '5ba4aa5c-8b25-46fa-82e2-2f463f632646'),
('96caadf9-13cd-409c-8024-944316873e18', '23dafb6e-571a-4acc-867e-29913527d7d3'),
('96caadf9-13cd-409c-8024-944316873e18', '83e83e2e-b040-4e7d-a8c8-cc26c6b573f0'),
('96caadf9-13cd-409c-8024-944316873e18', '3769cf11-3913-4ebc-9edf-88f61691c38b'),
('96caadf9-13cd-409c-8024-944316873e18', 'd1279d4a-4109-45b9-b758-6fd8222008c3'),
('96caadf9-13cd-409c-8024-944316873e18', 'f4b1bb77-c11e-4257-bae9-318bf170d3c0'),
('96caadf9-13cd-409c-8024-944316873e18', '28807f3b-f202-47da-8bca-c5755af8dd63'),
('96caadf9-13cd-409c-8024-944316873e18', '2a29c009-e742-43b7-b18e-6c2ace376280'),
('96caadf9-13cd-409c-8024-944316873e18', 'ffd639fa-2b3a-4213-87df-21f70e7b9e7a'),
('96caadf9-13cd-409c-8024-944316873e18', '4f18b8a9-c373-4ad9-befb-1d6cf9a3f9a8'),
('96caadf9-13cd-409c-8024-944316873e18', '34fbf0b2-e00b-4f29-af8f-fde9e48bc598'),
('96caadf9-13cd-409c-8024-944316873e18', 'ee4d0104-4159-4c70-9ca1-20fe0cac1c66'),
('96caadf9-13cd-409c-8024-944316873e18', '1cf326fc-d99c-405b-9a88-3506f93edac3'),
('96caadf9-13cd-409c-8024-944316873e18', '05e8a07e-d09d-4a87-baee-51192db2433b'),
('96caadf9-13cd-409c-8024-944316873e18', 'e5a13514-1f92-44b9-afb6-e2b040fdeb2d'),
('96caadf9-13cd-409c-8024-944316873e18', 'cfc79604-39bc-433a-ab06-2f40ec6fdec6'),
('96caadf9-13cd-409c-8024-944316873e18', '05e3205c-837f-4032-939c-686e5cb788b4'),
('96caadf9-13cd-409c-8024-944316873e18', '5f349aed-a18f-452e-b916-07d447cd30b5'),
('96caadf9-13cd-409c-8024-944316873e18', '76eca5df-8987-4f04-915c-281ac99071c3'),
('96caadf9-13cd-409c-8024-944316873e18', 'b3969b2e-7828-45c4-8e21-15dd1c70e831'),
('96caadf9-13cd-409c-8024-944316873e18', '4c451a17-dd97-40ad-91cb-f44709da157d'),
('96caadf9-13cd-409c-8024-944316873e18', '229b5716-91fd-498a-be56-4c5f7d8ee12b'),
('96caadf9-13cd-409c-8024-944316873e18', '29d96959-dace-4e4e-8b0c-7bdf66f9e515'),
('96caadf9-13cd-409c-8024-944316873e18', '830c4a89-0c0e-45ad-8154-16fb19cec72e'),
('96caadf9-13cd-409c-8024-944316873e18', '3204f7e0-ff40-4d17-9039-2e293ea3c135'),
('96caadf9-13cd-409c-8024-944316873e18', '5fa226a8-9fab-4d02-a400-9e6ce2215eef'),
('96caadf9-13cd-409c-8024-944316873e18', '1d487a6b-b2d0-42b1-aafe-24e56c1500a9'),
('96caadf9-13cd-409c-8024-944316873e18', '4d53b2a8-ae32-4c7b-829f-87015a74a28e'),
('96caadf9-13cd-409c-8024-944316873e18', 'e3d4f910-b537-42bd-b9b6-7e39a6d2263b'),
('96caadf9-13cd-409c-8024-944316873e18', 'c47f46d5-18c2-4a14-a258-2de363f1a2d2'),
('96caadf9-13cd-409c-8024-944316873e18', 'aa3baddf-e4d4-4854-b27a-0be95212bb99'),
('96caadf9-13cd-409c-8024-944316873e18', '02f9f26a-694a-42aa-9143-c53456f43b21'),
('96caadf9-13cd-409c-8024-944316873e18', 'b1b6025a-db18-4cc7-a3bd-4b05d7129eaf'),
('96caadf9-13cd-409c-8024-944316873e18', 'fe296719-75af-4145-b56c-e2be6388e138'),
('96caadf9-13cd-409c-8024-944316873e18', '1f96ea79-5f45-4d8b-984b-919a63d939ec'),
('96caadf9-13cd-409c-8024-944316873e18', '34938a20-09e6-4764-acb4-4608b4538daf'),
('96caadf9-13cd-409c-8024-944316873e18', 'ff526172-2f60-4485-ad57-68b2236de446'),
('96caadf9-13cd-409c-8024-944316873e18', '080b354f-26ff-4989-9db2-316419706812'),
-- admin: 36 permissions (same as super_admin minus manage_roles, manage_status)
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '29800588-ec53-439d-bf10-23b244c6fbb6'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '5ba4aa5c-8b25-46fa-82e2-2f463f632646'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '23dafb6e-571a-4acc-867e-29913527d7d3'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '83e83e2e-b040-4e7d-a8c8-cc26c6b573f0'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '3769cf11-3913-4ebc-9edf-88f61691c38b'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', 'd1279d4a-4109-45b9-b758-6fd8222008c3'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', 'f4b1bb77-c11e-4257-bae9-318bf170d3c0'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '28807f3b-f202-47da-8bca-c5755af8dd63'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '2a29c009-e742-43b7-b18e-6c2ace376280'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', 'ffd639fa-2b3a-4213-87df-21f70e7b9e7a'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '4f18b8a9-c373-4ad9-befb-1d6cf9a3f9a8'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '34fbf0b2-e00b-4f29-af8f-fde9e48bc598'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', 'ee4d0104-4159-4c70-9ca1-20fe0cac1c66'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '1cf326fc-d99c-405b-9a88-3506f93edac3'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '05e8a07e-d09d-4a87-baee-51192db2433b'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', 'e5a13514-1f92-44b9-afb6-e2b040fdeb2d'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', 'cfc79604-39bc-433a-ab06-2f40ec6fdec6'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '05e3205c-837f-4032-939c-686e5cb788b4'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '5f349aed-a18f-452e-b916-07d447cd30b5'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '76eca5df-8987-4f04-915c-281ac99071c3'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', 'b3969b2e-7828-45c4-8e21-15dd1c70e831'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '4c451a17-dd97-40ad-91cb-f44709da157d'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '229b5716-91fd-498a-be56-4c5f7d8ee12b'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '29d96959-dace-4e4e-8b0c-7bdf66f9e515'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '830c4a89-0c0e-45ad-8154-16fb19cec72e'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '3204f7e0-ff40-4d17-9039-2e293ea3c135'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '5fa226a8-9fab-4d02-a400-9e6ce2215eef'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '1d487a6b-b2d0-42b1-aafe-24e56c1500a9'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '4d53b2a8-ae32-4c7b-829f-87015a74a28e'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', 'e3d4f910-b537-42bd-b9b6-7e39a6d2263b'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', 'c47f46d5-18c2-4a14-a258-2de363f1a2d2'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', 'aa3baddf-e4d4-4854-b27a-0be95212bb99'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '02f9f26a-694a-42aa-9143-c53456f43b21'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', 'b1b6025a-db18-4cc7-a3bd-4b05d7129eaf'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', 'fe296719-75af-4145-b56c-e2be6388e138'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '1f96ea79-5f45-4d8b-984b-919a63d939ec'),
('d9f84b19-17ec-4711-b6e7-3552ac13071f', '080b354f-26ff-4989-9db2-316419706812'),
-- editor
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', '29800588-ec53-439d-bf10-23b244c6fbb6'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', '23dafb6e-571a-4acc-867e-29913527d7d3'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', '83e83e2e-b040-4e7d-a8c8-cc26c6b573f0'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', 'f4b1bb77-c11e-4257-bae9-318bf170d3c0'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', '2a29c009-e742-43b7-b18e-6c2ace376280'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', 'ffd639fa-2b3a-4213-87df-21f70e7b9e7a'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', '4f18b8a9-c373-4ad9-befb-1d6cf9a3f9a8'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', 'ee4d0104-4159-4c70-9ca1-20fe0cac1c66'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', '1cf326fc-d99c-405b-9a88-3506f93edac3'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', 'e5a13514-1f92-44b9-afb6-e2b040fdeb2d'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', 'cfc79604-39bc-433a-ab06-2f40ec6fdec6'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', '05e3205c-837f-4032-939c-686e5cb788b4'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', '5f349aed-a18f-452e-b916-07d447cd30b5'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', 'b3969b2e-7828-45c4-8e21-15dd1c70e831'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', '229b5716-91fd-498a-be56-4c5f7d8ee12b'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', '29d96959-dace-4e4e-8b0c-7bdf66f9e515'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', '3204f7e0-ff40-4d17-9039-2e293ea3c135'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', '5fa226a8-9fab-4d02-a400-9e6ce2215eef'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', '1d487a6b-b2d0-42b1-aafe-24e56c1500a9'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', 'e3d4f910-b537-42bd-b9b6-7e39a6d2263b'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', 'aa3baddf-e4d4-4854-b27a-0be95212bb99'),
('c237a9bc-a05c-41d7-acf2-a5ea6a9daac6', 'b1b6025a-db18-4cc7-a3bd-4b05d7129eaf'),
-- moderator
('aad5d25b-2015-413c-800f-4c6d29ece6df', '3769cf11-3913-4ebc-9edf-88f61691c38b'),
('aad5d25b-2015-413c-800f-4c6d29ece6df', '4f18b8a9-c373-4ad9-befb-1d6cf9a3f9a8'),
('aad5d25b-2015-413c-800f-4c6d29ece6df', 'e5a13514-1f92-44b9-afb6-e2b040fdeb2d'),
('aad5d25b-2015-413c-800f-4c6d29ece6df', '05e3205c-837f-4032-939c-686e5cb788b4'),
('aad5d25b-2015-413c-800f-4c6d29ece6df', '3204f7e0-ff40-4d17-9039-2e293ea3c135'),
('aad5d25b-2015-413c-800f-4c6d29ece6df', '1d487a6b-b2d0-42b1-aafe-24e56c1500a9'),
('aad5d25b-2015-413c-800f-4c6d29ece6df', '080b354f-26ff-4989-9db2-316419706812'),
-- author
('f727bbe4-b519-4185-ae35-6729a84d736e', '3769cf11-3913-4ebc-9edf-88f61691c38b'),
('f727bbe4-b519-4185-ae35-6729a84d736e', '2a29c009-e742-43b7-b18e-6c2ace376280'),
('f727bbe4-b519-4185-ae35-6729a84d736e', 'ffd639fa-2b3a-4213-87df-21f70e7b9e7a'),
('f727bbe4-b519-4185-ae35-6729a84d736e', '4f18b8a9-c373-4ad9-befb-1d6cf9a3f9a8'),
('f727bbe4-b519-4185-ae35-6729a84d736e', '1cf326fc-d99c-405b-9a88-3506f93edac3'),
('f727bbe4-b519-4185-ae35-6729a84d736e', '05e3205c-837f-4032-939c-686e5cb788b4'),
('f727bbe4-b519-4185-ae35-6729a84d736e', '5f349aed-a18f-452e-b916-07d447cd30b5'),
('f727bbe4-b519-4185-ae35-6729a84d736e', '229b5716-91fd-498a-be56-4c5f7d8ee12b'),
('f727bbe4-b519-4185-ae35-6729a84d736e', '29d96959-dace-4e4e-8b0c-7bdf66f9e515'),
('f727bbe4-b519-4185-ae35-6729a84d736e', '1d487a6b-b2d0-42b1-aafe-24e56c1500a9'),
('f727bbe4-b519-4185-ae35-6729a84d736e', 'b1b6025a-db18-4cc7-a3bd-4b05d7129eaf')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SECTION 9: CMS SEED DATA
-- =====================================================

INSERT INTO public.navigation_menus (id, name, location, is_active) VALUES
('4c186143-e0e0-4cc5-8ce6-7bd81f3b8f8d', 'main_menu', 'header', true),
('27706436-656d-466d-97cb-5fb8e8d09ef2', 'footer_menu', 'footer', true),
('6a80dc87-9868-4e8d-be65-4bdbd2d9f424', 'mobile_menu', 'mobile', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.navigation_items (id, menu_id, parent_id, label, url, is_external, open_in_new_tab, icon, sort_order, is_visible, css_class) VALUES
('ccb95f56-c624-4dbb-b30c-0cb6ffba4fff', '4c186143-e0e0-4cc5-8ce6-7bd81f3b8f8d', null, 'Main', '/', false, false, null, 1, false, null),
('f1d5390f-d4c4-4b6d-9e61-fd437abfbd04', '4c186143-e0e0-4cc5-8ce6-7bd81f3b8f8d', null, 'AI Tools', '/ai-tools', false, false, null, 2, false, null),
('2da2e26e-cc1b-4302-a9ee-4bffd2f1e7a3', '4c186143-e0e0-4cc5-8ce6-7bd81f3b8f8d', null, 'Blog', '/blog', false, false, null, 3, true, null),
('66e654bc-e128-4671-a90e-fe47c1c97f3d', '4c186143-e0e0-4cc5-8ce6-7bd81f3b8f8d', null, 'News', '/news', false, false, null, 4, true, null)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.footer_settings (id, key, value, value_json, category, display_name, sort_order) VALUES
('34b87be9-d802-4d33-94f8-9453bcad3a45', 'footer_description', 'AI Mematiane is your comprehensive hub for discovering AI tools, staying updated with AI news, and exploring in-depth analysis.', null, 'general', 'Footer Description', 1),
('68eb7ed7-4e5d-46ac-99d1-76c322b48c2e', 'footer_newsletter_enabled', 'true', null, 'newsletter', 'Enable Newsletter', 10),
('2d905ed8-391a-4776-b540-84e326a04e0c', 'footer_newsletter_title', 'Subscribe to be Updated', null, 'newsletter', 'Newsletter Title', 11)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.footer_columns (id, title, sort_order, is_visible) VALUES
('673c3ae4-dea2-4ebb-85c6-7b4b5980a89d', 'Help & Information', 0, true),
('aacd71e2-d65b-4b65-b8ff-160710d08df0', 'Our Team', 1, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.footer_links (id, column_id, label, url, is_external, icon, sort_order, is_visible) VALUES
('12948d63-7e61-4400-b0b2-a509de9b15f7', '673c3ae4-dea2-4ebb-85c6-7b4b5980a89d', 'F.A.Q', 'https://ai-mematiane-hub.vercel.app/pages/FAQ', false, null, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.footer_social_links (id, platform, label, url, icon_key, sort_order, is_visible) VALUES
('5578ca6f-a308-4413-9cd5-343eaf7be0e0', 'GitHub', 'GitHub', 'https://github.com/aimematiane', 'github', 1, true),
('5a813ef7-ca38-4a84-b1e4-5ddd04431932', 'Threads', 'Threads', 'https://www.threads.net/@aimematiane', 'threads', 2, true),
('537ff237-0cc9-46b7-9838-54c103724bfa', 'LinkedIn', 'LinkedIn', 'https://www.linkedin.com/in/ai-mematiane-879538415/', 'linkedin', 3, true),
('197cd81a-0c94-4ada-aa44-df302f857847', 'X (Twitter)', 'X', 'https://x.com/AIMematiane', 'twitter', 4, true),
('dcaf3864-5ed7-44ac-b1b9-8575fb774bc6', 'Discord', '', 'https://discord.gg/tzKWxBFkR', 'discord', 4, true)
ON CONFLICT (id) DO NOTHING;

-- Site Settings
INSERT INTO public.site_settings (id, key, value, value_json, category, display_name, description, input_type, sort_order, is_public) VALUES
('2ef51974-cb3d-4858-9a03-efbb691e97ce', 'site_name', 'AI Mematiane', null, 'general', 'Site Name', 'The name of your website', 'text', 1, true),
('651256af-2d8c-419f-bcb3-0901ac883940', 'site_description', 'AI Mematiane is a global directory of AI tools, news and analysis.', null, 'general', 'Site Description', 'A brief description of your website', 'textarea', 2, true),
('e1e6936d-7aff-4c1e-9897-85b730fb2568', 'site_tagline', 'Your AI Knowledge Hub', null, 'general', 'Site Tagline', 'A short tagline for your website', 'text', 3, true),
('78a700a1-a566-4024-8f01-a4a9f12f82af', 'site_url', 'https://ai-mematiane.com', null, 'general', 'Site URL', 'The full URL of your website', 'url', 4, true),
('4e5e3e66-b743-4b37-a896-f750cf88fdbc', 'logo_url', 'https://aocnsmmsddvnmrbnneds.supabase.co/storage/v1/object/public/uploads/media/1781697794154-4euhcg.svg', null, 'branding', 'Logo URL', 'URL to your site logo', 'image', 1, true),
('ace23947-3311-4a75-a532-409984c0fe23', 'logo_dark_url', 'https://aocnsmmsddvnmrbnneds.supabase.co/storage/v1/object/public/uploads/media/1781697794154-4euhcg.svg', null, 'branding', 'Dark Logo URL', 'URL to your dark mode logo', 'image', 2, true),
('44701c23-e203-46a2-9b1d-ae288fd8f84c', 'favicon_url', 'https://aocnsmmsddvnmrbnneds.supabase.co/storage/v1/object/public/uploads/media/1781697794154-4euhcg.svg', null, 'branding', 'Favicon URL', 'URL to your favicon', 'image', 3, true),
('56187762-4ac1-4773-b2c2-c8648644e307', 'og_image_url', 'https://aocnsmmsddvnmrbnneds.supabase.co/storage/v1/object/public/uploads/media/1781697794154-4euhcg.svg', null, 'branding', 'Default OG Image', 'Default Open Graph image for social sharing', 'image', 4, true),
('9fe8235b-dfe3-4ef7-a836-5f7e0be5d133', 'theme_preset', 'default', '{"options":[{"value":"default","label":"Default Dark Cyan"},{"value":"earth","label":"Earth Green"},{"value":"apple","label":"Apple Minimal"},{"value":"editorial","label":"Editorial Magazine"},{"value":"studio","label":"Warm Studio"},{"value":"midnight","label":"Midnight Prism"},{"value":"aurora","label":"Aurora Signal"},{"value":"graphite","label":"Graphite Pro"},{"value":"custom","label":"Custom Unsaved"}]}'::jsonb, 'branding', 'Theme Preset', 'Choose a built-in preset, adjust one into a custom theme, or select a saved custom theme.', 'select', 5, true),
('4c6ab483-d25e-4f88-a3cb-f232a9c2b11f', 'active_custom_theme_id', '', null, 'branding', 'Active Custom Theme ID', 'Internal reference for the active saved custom theme', 'text', 6, true),
('4a1b1c47-31f2-49dd-a8d8-e43e3394764b', 'active_custom_theme_name', '', null, 'branding', 'Active Custom Theme Name', 'Display name for the active saved custom theme', 'text', 7, true),
('aa910835-d9a5-4808-8ea0-3894dd1de457', 'contact_email', 'AIMEMATIANE@GMAIL.COM', null, 'contact', 'Contact Email', 'Primary contact email address', 'email', 1, true),
('0613b17f-2b5a-4ada-977d-828a5c31ebce', 'contact_phone', '+49 174 530 9791', null, 'contact', 'Contact Phone', 'Contact phone number', 'text', 2, true),
('1ef420b2-661e-4deb-a7fb-b041aad18829', 'contact_address', 'Germany Berlin Lichtenberg', null, 'contact', 'Contact Address', 'Physical address', 'textarea', 3, true),
('075117fc-8455-427a-8809-0ed624d1a81a', 'copyright_text', '©2026 AI Mematiane. All rights reserved.', null, 'legal', 'Copyright Text', 'Footer copyright text', 'text', 1, true),
('b067337f-7f81-4a11-9e8b-3f5377da81fc', 'privacy_policy_url', '/privacy', null, 'legal', 'Privacy Policy URL', 'URL to privacy policy page', 'url', 2, true),
('46cec1b9-fbad-4264-a6da-d385b4aef17a', 'terms_url', '/terms', null, 'legal', 'Terms URL', 'URL to terms of service page', 'url', 3, true),
('40d33bb9-9d91-4591-8e4c-0f9b3f410a63', 'google_analytics_id', 'google-site-verification=drwYqIUmJGErmHMXwOE5i5kZnvTD1-0BMvVz9iov4tU', null, 'analytics', 'Google Analytics ID', 'Google Analytics measurement ID (G-XXXXXXX)', 'text', 1, false),
('3f924bed-7c7d-48d6-a0cb-023820cdbc88', 'google_tag_manager_id', 'google-site-verification=drwYqIUmJGErmHMXwOE5i5kZnvTD1-0BMvVz9iov4tU', null, 'analytics', 'Google Tag Manager ID', 'Google Tag Manager container ID (GTM-XXXXX)', 'text', 2, false),
('e0242f31-8aaf-4e34-9624-35c7b8d5ea19', 'social_twitter', '', null, 'social', 'Twitter URL', 'Twitter/X profile URL', 'url', 1, true),
('1f96da99-4728-4b2e-9a0f-b7a7b7fa065a', 'social_facebook', '', null, 'social', 'Facebook URL', 'Facebook page URL', 'url', 2, true),
('9aa73143-3c70-4bbb-9e6b-0d9a7a26ac38', 'social_linkedin', '', null, 'social', 'LinkedIn URL', 'LinkedIn company page URL', 'url', 3, true),
('ee6980d2-de03-43d6-bf38-8ac9aa54dbe3', 'social_github', '', null, 'social', 'GitHub URL', 'GitHub organization URL', 'url', 4, true),
('c7b2bdb5-5146-4364-b614-5c61bf736dea', 'social_youtube', '', null, 'social', 'YouTube URL', 'YouTube channel URL', 'url', 5, true),
('69008ccc-c5a7-46b7-baad-380df6486a1b', 'social_discord', '321213', null, 'social', 'Discord URL', 'Discord server invite URL', 'url', 6, true),
('b491f66a-70a7-4ba2-89ee-2ee3d44af6c8', 'custom_header_scripts', '', null, 'custom', 'Header Scripts', 'Custom scripts to add to the header (analytics, etc)', 'textarea', 1, false),
('3a0c6e35-c850-446a-9cf5-ca73d55c78a7', 'custom_footer_scripts', '', null, 'custom', 'Footer Scripts', 'Custom scripts to add before closing body tag', 'textarea', 2, false),
('dd704552-85fc-4eef-ab5f-38b2fb4690f6', 'custom_css', '', null, 'custom', 'Custom CSS', 'Additional custom CSS styles', 'textarea', 3, false)
ON CONFLICT (id) DO NOTHING;

-- Theme Settings
INSERT INTO public.theme_settings (id, key, value, category, display_name, css_variable, sort_order) VALUES
('675892ed-d524-4caa-a98c-99b17c1c59f5', 'color_primary', '#6c530e', 'colors', 'Primary Color', '--color-primary', 1),
('080b1115-dd34-466b-aba8-b3b5bcb34660', 'color_primary_hover', '#24eb8e', 'colors', 'Primary Hover', '--color-primary-hover', 2),
('6fd361c0-0112-4436-8b63-5ef843cf3f6e', 'color_primary_active', '#d71d1d', 'colors', 'Primary Active', '--color-primary-active', 3),
('a02d22ce-6b60-449e-bc4d-29c413d115bd', 'color_accent', '#000000', 'colors', 'Accent Color', '--color-accent', 4),
('30057e49-5518-4e4e-9e6d-6712623eef67', 'color_accent_hover', '#08af13', 'colors', 'Accent Hover', '--color-accent-hover', 5),
('f0e8b51e-b02e-4071-8637-7327c59417de', 'color_bg_primary', '#0f172a', 'colors', 'Background Primary', '--bg-primary', 10),
('462ed439-973c-4197-b3b6-2d994f032de3', 'color_bg_secondary', '#1d393a', 'colors', 'Background Secondary', '--bg-secondary', 11),
('a44a54e6-a71f-4622-96c0-e277367b8f98', 'color_bg_tertiary', '#334155', 'colors', 'Background Tertiary', '--bg-tertiary', 12),
('6096cb70-31b7-49f4-8578-7180b3f37db3', 'color_surface_900', '#0f172a', 'colors', 'Surface 900', '--surface-900', 20),
('0e5d9906-4269-4e23-b951-0762be5e888b', 'color_surface_800', '#1e293b', 'colors', 'Surface 800', '--surface-800', 21),
('23173113-f40b-41f9-b947-07fcfc84bfa4', 'color_surface_700', '#334155', 'colors', 'Surface 700', '--surface-700', 22),
('ff2f2abc-e6c3-47ca-bcd4-13bbff040077', 'color_text_primary', '#f8fafc', 'colors', 'Text Primary', '--text-primary', 30),
('7bf6c7ff-86f7-4410-9fbb-2971a72d8c84', 'color_text_secondary', '#cbd5e1', 'colors', 'Text Secondary', '--text-secondary', 31),
('48df19f9-11ae-4e0b-beee-b311863f7f45', 'color_text_muted', '#64748b', 'colors', 'Text Muted', '--text-muted', 32),
('10d98500-a7bb-4cb9-b7af-69cf36f50035', 'color_success', '#10b981', 'colors', 'Success Color', '--color-success', 40),
('9ef4f446-a98d-47dc-bbd1-f24ec59464b3', 'color_warning', '#f59e0b', 'colors', 'Warning Color', '--color-warning', 41),
('5d3a987d-8315-466b-b9df-793d76742707', 'color_error', '#ef4444', 'colors', 'Error Color', '--color-error', 42),
('fa420bcf-5718-4ed2-bf4b-92f2e8f0c9ee', 'font_heading', 'Outfit', 'typography', 'Heading Font', '--font-heading', 50),
('62f05f4f-1449-4d84-b4be-4c5af86b6832', 'font_heading_weight', '600', 'typography', 'Heading Weight', '--font-heading-weight', 51),
('1078a013-94ea-4a36-bbe0-21b4417d8ff1', 'font_body', 'Inter', 'typography', 'Body Font', '--font-body', 52),
('c28342de-3265-48c9-a31a-4e2e20df2d34', 'font_body_weight', '400', 'typography', 'Body Weight', '--font-body-weight', 53),
('0e23a6af-cacb-49b6-a829-f9ddd7ee5b7f', 'radius_md', '8px', 'layout', 'Medium Radius', '--radius-md', 61),
('4805e3e0-4f63-4aa0-9d14-1c21d34feeb0', 'radius_lg', '12px', 'layout', 'Large Radius', '--radius-lg', 62),
('9622a1a9-0e36-4857-b0a9-242d084586b2', 'radius_xl', '16px', 'layout', 'Extra Large Radius', '--radius-xl', 63),
('2e9d6e72-3c33-4a3e-9f9d-61a3643f7341', 'color_light_bg_primary', '#ffffff', 'colors', 'Light Page Background', '--light-bg-primary', 80),
('55b34ad6-8fc6-4985-b4c9-bd2ee2ac2386', 'color_light_bg_secondary', '#f8fafc', 'colors', 'Light Panel Background', '--light-bg-secondary', 81),
('559a5bea-2802-41bd-9db5-081ab016cbda', 'color_light_bg_tertiary', '#d1d5db', 'colors', 'Light Border Surface', '--light-bg-tertiary', 82),
('e70813c3-3e73-49d8-a245-28b0c9602b96', 'color_light_text_primary', '#0f172a', 'colors', 'Light Text Primary', '--light-text-primary', 83),
('a60d994b-6f38-4f83-af7d-83ed1d176e76', 'color_light_text_secondary', '#334155', 'colors', 'Light Text Secondary', '--light-text-secondary', 84),
('beca2a5f-b1c6-4f3f-b3c5-282a736e8453', 'color_light_text_muted', '#64748b', 'colors', 'Light Text Muted', '--light-text-muted', 85),
('140df806-fe5b-4065-b684-d9a35aa2c28f', 'shadow_sm', '0 1px 2px 0 rgb(0 0 0 / 0.05)', 'layout', 'Small Shadow', '--shadow-sm', 70),
('f8928fc8-0a42-4d18-aafc-a8bb36b33580', 'shadow_md', '0 4px 6px -1px rgb(0 0 0 / 0.1)', 'layout', 'Medium Shadow', '--shadow-md', 71),
('0e0f91e7-8d94-42c3-b3f5-a3613947ebc5', 'shadow_lg', '0 10px 15px -3px rgb(0 0 0 / 0.1)', 'layout', 'Large Shadow', '--shadow-lg', 72)
ON CONFLICT (id) DO NOTHING;
