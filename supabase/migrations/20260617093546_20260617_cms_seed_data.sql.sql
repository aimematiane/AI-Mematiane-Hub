-- ============================================
-- CMS SEED DATA
-- ============================================

-- 1. DEFAULT ROLES
INSERT INTO roles (name, display_name, description, is_system, level) VALUES
('super_admin', 'Super Admin', 'Full system access with all permissions', true, 100),
('admin', 'Administrator', 'Full administrative access', true, 80),
('editor', 'Editor', 'Can create and edit content', true, 60),
('moderator', 'Moderator', 'Can moderate user content', true, 40),
('author', 'Author', 'Can create own content', true, 20),
('user', 'User', 'Basic user access', true, 0)
ON CONFLICT (name) DO NOTHING;

-- 2. PERMISSIONS
INSERT INTO permissions (name, display_name, module, action, description) VALUES
-- Site Settings
('site_settings.view', 'View Site Settings', 'site_settings', 'view', 'View site settings'),
('site_settings.edit', 'Edit Site Settings', 'site_settings', 'edit', 'Edit site settings'),
-- Theme
('theme.view', 'View Theme Settings', 'theme', 'view', 'View theme settings'),
('theme.edit', 'Edit Theme Settings', 'theme', 'edit', 'Edit theme settings'),
-- Navigation
('navigation.view', 'View Navigation', 'navigation', 'view', 'View navigation menus'),
('navigation.edit', 'Edit Navigation', 'navigation', 'edit', 'Edit navigation menus'),
-- Pages
('pages.view', 'View Pages', 'pages', 'view', 'View all pages'),
('pages.create', 'Create Pages', 'pages', 'create', 'Create new pages'),
('pages.edit', 'Edit Pages', 'pages', 'edit', 'Edit existing pages'),
('pages.delete', 'Delete Pages', 'pages', 'delete', 'Delete pages'),
('pages.publish', 'Publish Pages', 'pages', 'publish', 'Publish pages'),
-- Posts
('posts.view', 'View Posts', 'posts', 'view', 'View all posts'),
('posts.create', 'Create Posts', 'posts', 'create', 'Create new posts'),
('posts.edit', 'Edit Posts', 'posts', 'edit', 'Edit any post'),
('posts.delete', 'Delete Posts', 'posts', 'delete', 'Delete any post'),
('posts.publish', 'Publish Posts', 'posts', 'publish', 'Publish posts'),
-- News
('news.view', 'View News', 'news', 'view', 'View all news'),
('news.create', 'Create News', 'news', 'create', 'Create news articles'),
('news.edit', 'Edit News', 'news', 'edit', 'Edit any news article'),
('news.delete', 'Delete News', 'news', 'delete', 'Delete news articles'),
('news.publish', 'Publish News', 'news', 'publish', 'Publish news'),
-- AI Tools
('ai_tools.view', 'View AI Tools', 'ai_tools', 'view', 'View all AI tools'),
('ai_tools.create', 'Create AI Tools', 'ai_tools', 'create', 'Create AI tool entries'),
('ai_tools.edit', 'Edit AI Tools', 'ai_tools', 'edit', 'Edit any AI tool'),
('ai_tools.delete', 'Delete AI Tools', 'ai_tools', 'delete', 'Delete AI tools'),
-- Users
('users.view', 'View Users', 'users', 'view', 'View user profiles'),
('users.edit', 'Edit Users', 'users', 'edit', 'Edit user profiles'),
('users.delete', 'Delete Users', 'users', 'delete', 'Delete users'),
('users.manage_roles', 'Manage User Roles', 'users', 'manage_roles', 'Assign roles to users'),
-- Media
('media.view', 'View Media', 'media', 'view', 'View media library'),
('media.upload', 'Upload Media', 'media', 'upload', 'Upload new media'),
('media.edit', 'Edit Media', 'media', 'edit', 'Edit media files'),
('media.delete', 'Delete Media', 'media', 'delete', 'Delete media files'),
-- Categories & Tags
('taxonomy.view', 'View Taxonomy', 'taxonomy', 'view', 'View categories and tags'),
('taxonomy.edit', 'Edit Taxonomy', 'taxonomy', 'edit', 'Manage categories and tags'),
-- Footer
('footer.view', 'View Footer', 'footer', 'view', 'View footer settings'),
('footer.edit', 'Edit Footer', 'footer', 'edit', 'Edit footer settings'),
-- Audit Logs
('audit.view', 'View Audit Logs', 'audit', 'view', 'View audit logs'),
-- SEO
('seo.view', 'View SEO', 'seo', 'view', 'View SEO settings'),
('seo.edit', 'Edit SEO', 'seo', 'edit', 'Edit SEO settings')
ON CONFLICT (name) DO NOTHING;

-- 3. ROLE-PERMISSION ASSIGNMENTS
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Admin gets most permissions (except some critical ones)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
WHERE r.name = 'admin' AND p.name NOT LIKE '%users.manage_roles%'
ON CONFLICT DO NOTHING;

-- Editor permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
WHERE r.name = 'editor' AND p.name IN (
  'site_settings.view', 'theme.view', 'navigation.view', 'pages.view', 'pages.create', 'pages.edit',
  'posts.view', 'posts.create', 'posts.edit', 'posts.publish',
  'news.view', 'news.create', 'news.edit', 'news.publish',
  'ai_tools.view', 'ai_tools.create', 'ai_tools.edit',
  'media.view', 'media.upload', 'media.edit',
  'taxonomy.view', 'footer.view', 'seo.view'
)
ON CONFLICT DO NOTHING;

-- Moderator permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
WHERE r.name = 'moderator' AND p.name IN (
  'posts.view', 'posts.edit',
  'news.view', 'news.edit',
  'users.view', 'media.view', 'audit.view'
)
ON CONFLICT DO NOTHING;

-- Author permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
WHERE r.name = 'author' AND p.name IN (
  'pages.view', 'pages.create',
  'posts.view', 'posts.create',
  'news.view', 'news.create',
  'media.view', 'media.upload', 'media.edit',
  'taxonomy.view', 'audit.view'
)
ON CONFLICT DO NOTHING;

-- 4. DEFAULT SITE SETTINGS
INSERT INTO site_settings (key, value, category, display_name, description, input_type, is_public, sort_order) VALUES
-- General
('site_name', 'AI Mematiane', 'general', 'Site Name', 'The name of your website', 'text', true, 1),
('site_description', 'AI Mematiane is a global directory of AI tools, news and analysis.', 'general', 'Site Description', 'A brief description of your website', 'textarea', true, 2),
('site_tagline', 'Your AI Knowledge Hub', 'general', 'Site Tagline', 'A short tagline for your website', 'text', true, 3),
('site_url', 'https://ai-mematiane.com', 'general', 'Site URL', 'The full URL of your website', 'url', true, 4),
-- Branding
('logo_url', '', 'branding', 'Logo URL', 'URL to your site logo', 'image', true, 1),
('logo_dark_url', '', 'branding', 'Dark Logo URL', 'URL to your dark mode logo', 'image', true, 2),
('favicon_url', '/favicon.svg', 'branding', 'Favicon URL', 'URL to your favicon', 'image', true, 3),
('og_image_url', '', 'branding', 'Default OG Image', 'Default Open Graph image for social sharing', 'image', true, 4),
-- Contact
('contact_email', '', 'contact', 'Contact Email', 'Primary contact email address', 'email', true, 1),
('contact_phone', '', 'contact', 'Contact Phone', 'Contact phone number', 'text', true, 2),
('contact_address', '', 'contact', 'Contact Address', 'Physical address', 'textarea', true, 3),
-- Social Media
('social_twitter', '', 'social', 'Twitter URL', 'Twitter/X profile URL', 'url', true, 1),
('social_facebook', '', 'social', 'Facebook URL', 'Facebook page URL', 'url', true, 2),
('social_linkedin', '', 'social', 'LinkedIn URL', 'LinkedIn company page URL', 'url', true, 3),
('social_github', '', 'social', 'GitHub URL', 'GitHub organization URL', 'url', true, 4),
('social_youtube', '', 'social', 'YouTube URL', 'YouTube channel URL', 'url', true, 5),
('social_discord', '', 'social', 'Discord URL', 'Discord server invite URL', 'url', true, 6),
-- Legal
('copyright_text', '© 2024 AI Mematiane. All rights reserved.', 'legal', 'Copyright Text', 'Footer copyright text', 'text', true, 1),
('privacy_policy_url', '/privacy', 'legal', 'Privacy Policy URL', 'URL to privacy policy page', 'url', true, 2),
('terms_url', '/terms', 'legal', 'Terms URL', 'URL to terms of service page', 'url', true, 3),
-- Analytics
('google_analytics_id', '', 'analytics', 'Google Analytics ID', 'Google Analytics measurement ID (G-XXXXXXX)', 'text', false, 1),
('google_tag_manager_id', '', 'analytics', 'Google Tag Manager ID', 'Google Tag Manager container ID (GTM-XXXXX)', 'text', false, 2),
-- Custom Code
('custom_header_scripts', '', 'custom', 'Header Scripts', 'Custom scripts to add to the header (analytics, etc)', 'textarea', false, 1),
('custom_footer_scripts', '', 'custom', 'Footer Scripts', 'Custom scripts to add before closing body tag', 'textarea', false, 2),
('custom_css', '', 'custom', 'Custom CSS', 'Additional custom CSS styles', 'textarea', false, 3)
ON CONFLICT (key) DO NOTHING;

-- 5. DEFAULT THEME SETTINGS
INSERT INTO theme_settings (key, value, category, display_name, css_variable, sort_order) VALUES
-- Colors - Primary
('color_primary', '#3b82f6', 'colors', 'Primary Color', '--color-primary', 1),
('color_primary_hover', '#2563eb', 'colors', 'Primary Hover', '--color-primary-hover', 2),
('color_primary_active', '#1d4ed8', 'colors', 'Primary Active', '--color-primary-active', 3),
-- Colors - Accent
('color_accent', '#06b6d4', 'colors', 'Accent Color', '--color-accent', 4),
('color_accent_hover', '#0891b2', 'colors', 'Accent Hover', '--color-accent-hover', 5),
-- Colors - Background
('color_bg_primary', '#0f172a', 'colors', 'Background Primary', '--bg-primary', 10),
('color_bg_secondary', '#1e293b', 'colors', 'Background Secondary', '--bg-secondary', 11),
('color_bg_tertiary', '#334155', 'colors', 'Background Tertiary', '--bg-tertiary', 12),
-- Colors - Surface
('color_surface_900', '#0f172a', 'colors', 'Surface 900', '--surface-900', 20),
('color_surface_800', '#1e293b', 'colors', 'Surface 800', '--surface-800', 21),
('color_surface_700', '#334155', 'colors', 'Surface 700', '--surface-700', 22),
-- Colors - Text
('color_text_primary', '#f8fafc', 'colors', 'Text Primary', '--text-primary', 30),
('color_text_secondary', '#cbd5e1', 'colors', 'Text Secondary', '--text-secondary', 31),
('color_text_muted', '#64748b', 'colors', 'Text Muted', '--text-muted', 32),
-- Colors - Status
('color_success', '#10b981', 'colors', 'Success Color', '--color-success', 40),
('color_warning', '#f59e0b', 'colors', 'Warning Color', '--color-warning', 41),
('color_error', '#ef4444', 'colors', 'Error Color', '--color-error', 42),
-- Typography - Headings
('font_heading', 'Outfit', 'typography', 'Heading Font', '--font-heading', 50),
('font_heading_weight', '600', 'typography', 'Heading Weight', '--font-heading-weight', 51),
-- Typography - Body
('font_body', 'Inter', 'typography', 'Body Font', '--font-body', 52),
('font_body_weight', '400', 'typography', 'Body Weight', '--font-body-weight', 53),
-- Layout - Radius
('radius_sm', '4px', 'layout', 'Small Radius', '--radius-sm', 60),
('radius_md', '8px', 'layout', 'Medium Radius', '--radius-md', 61),
('radius_lg', '12px', 'layout', 'Large Radius', '--radius-lg', 62),
('radius_xl', '16px', 'layout', 'Extra Large Radius', '--radius-xl', 63),
-- Layout - Shadows
('shadow_sm', '0 1px 2px 0 rgb(0 0 0 / 0.05)', 'layout', 'Small Shadow', '--shadow-sm', 70),
('shadow_md', '0 4px 6px -1px rgb(0 0 0 / 0.1)', 'layout', 'Medium Shadow', '--shadow-md', 71),
('shadow_lg', '0 10px 15px -3px rgb(0 0 0 / 0.1)', 'layout', 'Large Shadow', '--shadow-lg', 72)
ON CONFLICT (key) DO NOTHING;

-- 6. DEFAULT NAVIGATION MENUS
INSERT INTO navigation_menus (name, location, is_active) VALUES
('main_menu', 'header', true),
('footer_menu', 'footer', true),
('mobile_menu', 'mobile', true)
ON CONFLICT (name) DO NOTHING;

-- 7. DEFAULT NAVIGATION ITEMS
INSERT INTO navigation_items (menu_id, label, url, sort_order, is_visible)
SELECT m.id, 'Home', '/', 1, true FROM navigation_menus m WHERE m.name = 'main_menu'
ON CONFLICT DO NOTHING;

INSERT INTO navigation_items (menu_id, label, url, sort_order, is_visible)
SELECT m.id, 'AI Tools', '/ai-tools', 2, true FROM navigation_menus m WHERE m.name = 'main_menu'
ON CONFLICT DO NOTHING;

INSERT INTO navigation_items (menu_id, label, url, sort_order, is_visible)
SELECT m.id, 'Blog', '/blog', 3, true FROM navigation_menus m WHERE m.name = 'main_menu'
ON CONFLICT DO NOTHING;

INSERT INTO navigation_items (menu_id, label, url, sort_order, is_visible)
SELECT m.id, 'News', '/news', 4, true FROM navigation_menus m WHERE m.name = 'main_menu'
ON CONFLICT DO NOTHING;

-- 8. DEFAULT FOOTER COLUMNS
INSERT INTO footer_columns (title, sort_order, is_visible) VALUES
('Quick Links', 1, true),
('Resources', 2, true),
('Legal', 3, true),
('Connect', 4, true)
ON CONFLICT DO NOTHING;

-- 9. DEFAULT FOOTER SETTINGS
INSERT INTO footer_settings (key, value, category, display_name, sort_order) VALUES
('footer_description', 'AI Mematiane is your comprehensive hub for discovering AI tools, staying updated with AI news, and exploring in-depth analysis.', 'general', 'Footer Description', 1),
('footer_newsletter_enabled', 'true', 'newsletter', 'Enable Newsletter', 10),
('footer_newsletter_title', 'Subscribe to Our Newsletter', 'newsletter', 'Newsletter Title', 11)
ON CONFLICT (key) DO NOTHING;

-- 10. DEFAULT CATEGORIES
INSERT INTO categories (name, slug, entity_type, sort_order) VALUES
('General', 'general', 'post', 1),
('Technology', 'technology', 'post', 2),
('Industry News', 'industry-news', 'news', 1),
('Research', 'research', 'news', 2),
('Text Generation', 'text-generation', 'ai_tool', 1),
('Image Generation', 'image-generation', 'ai_tool', 2),
('Video Generation', 'video-generation', 'ai_tool', 3),
('Audio', 'audio', 'ai_tool', 4),
('Code Assistants', 'code-assistants', 'ai_tool', 5),
('Data Analysis', 'data-analysis', 'ai_tool', 6)
ON CONFLICT (slug) DO NOTHING;