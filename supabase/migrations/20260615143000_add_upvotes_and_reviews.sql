-- Upvotes table (bookmarks are bookmarks, upvotes are likes)
CREATE TABLE IF NOT EXISTS upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('post', 'news', 'ai_tool')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Reviews/comments table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('post', 'news', 'ai_tool')),
  item_id UUID NOT NULL,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist to prevent duplicate errors
DROP POLICY IF EXISTS "select_upvotes" ON upvotes;
DROP POLICY IF EXISTS "insert_own_upvotes" ON upvotes;
DROP POLICY IF EXISTS "delete_own_upvotes" ON upvotes;

DROP POLICY IF EXISTS "select_reviews" ON reviews;
DROP POLICY IF EXISTS "insert_own_reviews" ON reviews;
DROP POLICY IF EXISTS "update_own_reviews" ON reviews;
DROP POLICY IF EXISTS "delete_own_reviews" ON reviews;

-- Upvotes policies
CREATE POLICY "select_upvotes" ON upvotes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_own_upvotes" ON upvotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_upvotes" ON upvotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "select_reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_own_reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_reviews" ON reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_reviews" ON reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Database View to fetch ai_tools with aggregated upvote counts and avg ratings
CREATE OR REPLACE VIEW ai_tools_view AS
SELECT 
  t.*,
  COALESCE(u.count, 0)::INTEGER as upvotes_count,
  COALESCE(r.avg_rating, 0.0)::NUMERIC(3,2) as avg_rating,
  COALESCE(r.count, 0)::INTEGER as reviews_count
FROM ai_tools t
LEFT JOIN (
  SELECT item_id, COUNT(*) as count 
  FROM upvotes 
  WHERE item_type = 'ai_tool'
  GROUP BY item_id
) u ON t.id = u.item_id
LEFT JOIN (
  SELECT item_id, AVG(rating) as avg_rating, COUNT(*) as count
  FROM reviews
  WHERE item_type = 'ai_tool' AND rating IS NOT NULL
  GROUP BY item_id
) r ON t.id = r.item_id;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_upvotes_item ON upvotes(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_item ON reviews(item_type, item_id);
