-- Convert TEXT[] columns to JSONB for reliable array storage from JS client
-- Step 1: Add new JSONB columns
ALTER TABLE ai_tools ADD COLUMN attachments_json JSONB DEFAULT '[]';
ALTER TABLE posts ADD COLUMN attachments_json JSONB DEFAULT '[]';
ALTER TABLE posts ADD COLUMN references_json JSONB DEFAULT '[]';
ALTER TABLE news ADD COLUMN attachments_json JSONB DEFAULT '[]';
ALTER TABLE news ADD COLUMN references_json JSONB DEFAULT '[]';

-- Step 2: Copy data from old TEXT[] columns to new JSONB columns
UPDATE ai_tools SET attachments_json = to_jsonb(attachments) WHERE attachments IS NOT NULL AND array_length(attachments, 1) > 0;
UPDATE posts SET attachments_json = to_jsonb(attachments) WHERE attachments IS NOT NULL AND array_length(attachments, 1) > 0;
UPDATE posts SET references_json = to_jsonb(references_links) WHERE references_links IS NOT NULL AND array_length(references_links, 1) > 0;
UPDATE news SET attachments_json = to_jsonb(attachments) WHERE attachments IS NOT NULL AND array_length(attachments, 1) > 0;
UPDATE news SET references_json = to_jsonb(references_links) WHERE references_links IS NOT NULL AND array_length(references_links, 1) > 0;

-- Step 3: Drop old columns and rename new ones
ALTER TABLE ai_tools DROP COLUMN attachments;
ALTER TABLE ai_tools RENAME COLUMN attachments_json TO attachments;

ALTER TABLE posts DROP COLUMN attachments;
ALTER TABLE posts RENAME COLUMN attachments_json TO attachments;

ALTER TABLE posts DROP COLUMN references_links;
ALTER TABLE posts RENAME COLUMN references_json TO references_links;

ALTER TABLE news DROP COLUMN attachments;
ALTER TABLE news RENAME COLUMN attachments_json TO attachments;

ALTER TABLE news DROP COLUMN references_links;
ALTER TABLE news RENAME COLUMN references_json TO references_links;
