-- Footer social links table
CREATE TABLE footer_social_links (
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

ALTER TABLE footer_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_footer_social_links" ON footer_social_links
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "manage_footer_social_links" ON footer_social_links
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX idx_footer_social_links_sort ON footer_social_links(sort_order);

DROP TRIGGER IF EXISTS update_footer_social_links_updated_at ON footer_social_links;
CREATE TRIGGER update_footer_social_links_updated_at
  BEFORE UPDATE ON footer_social_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed with current hardcoded social links
INSERT INTO footer_social_links (platform, label, url, icon_key, sort_order) VALUES
  ('GitHub', 'GitHub', 'https://github.com/aimematiane', 'github', 1),
  ('Threads', 'Threads', 'https://www.threads.net/@aimematiane', 'threads', 2),
  ('LinkedIn', 'LinkedIn', 'https://www.linkedin.com/in/ai-mematiane-879538415/', 'linkedin', 3),
  ('X (Twitter)', 'X', 'https://x.com/AIMematiane', 'twitter', 4)
ON CONFLICT DO NOTHING;