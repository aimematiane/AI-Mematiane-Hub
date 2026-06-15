-- Add additional fields to ai_tools
ALTER TABLE ai_tools ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE ai_tools ADD COLUMN IF NOT EXISTS paper_url TEXT;
ALTER TABLE ai_tools ADD COLUMN IF NOT EXISTS pricing TEXT DEFAULT 'free';
ALTER TABLE ai_tools ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';

-- Add additional fields to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS references_links TEXT[] DEFAULT '{}';

-- Add additional fields to news
ALTER TABLE news ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';
ALTER TABLE news ADD COLUMN IF NOT EXISTS references_links TEXT[] DEFAULT '{}';
