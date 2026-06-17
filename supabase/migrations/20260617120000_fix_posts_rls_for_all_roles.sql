-- Fix RLS policies for posts table to allow all non-user roles
-- This allows admin, super_admin, editor, content_manager, author, moderator to create posts

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "insert_posts" ON posts;
DROP POLICY IF EXISTS "update_posts" ON posts;
DROP POLICY IF EXISTS "delete_posts" ON posts;

-- Create new policies that allow any non-user role
CREATE POLICY "insert_posts" ON posts FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'user')
);

CREATE POLICY "update_posts" ON posts FOR UPDATE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'user')
) 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'user')
);

CREATE POLICY "delete_posts" ON posts FOR DELETE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'user')
);

-- Same fix for news table
DROP POLICY IF EXISTS "insert_news" ON news;
DROP POLICY IF EXISTS "update_news" ON news;
DROP POLICY IF EXISTS "delete_news" ON news;

CREATE POLICY "insert_news" ON news FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'user')
);

CREATE POLICY "update_news" ON news FOR UPDATE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'user')
) 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'user')
);

CREATE POLICY "delete_news" ON news FOR DELETE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'user')
);

-- Same fix for ai_tools table
DROP POLICY IF EXISTS "insert_ai_tools" ON ai_tools;
DROP POLICY IF EXISTS "update_ai_tools" ON ai_tools;
DROP POLICY IF EXISTS "delete_ai_tools" ON ai_tools;

CREATE POLICY "insert_ai_tools" ON ai_tools FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'user')
);

CREATE POLICY "update_ai_tools" ON ai_tools FOR UPDATE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'user')
) 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'user')
);

CREATE POLICY "delete_ai_tools" ON ai_tools FOR DELETE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'user')
);
