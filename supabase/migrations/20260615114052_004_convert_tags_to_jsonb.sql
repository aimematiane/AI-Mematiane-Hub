-- Convert tags TEXT[] to JSONB on all tables
ALTER TABLE ai_tools ADD COLUMN tags_json JSONB DEFAULT '[]';
ALTER TABLE posts ADD COLUMN tags_json JSONB DEFAULT '[]';
ALTER TABLE news ADD COLUMN tags_json JSONB DEFAULT '[]';

UPDATE ai_tools SET tags_json = to_jsonb(tags) WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;
UPDATE posts SET tags_json = to_jsonb(tags) WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;
UPDATE news SET tags_json = to_jsonb(tags) WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

ALTER TABLE ai_tools DROP COLUMN tags;
ALTER TABLE ai_tools RENAME COLUMN tags_json TO tags;

ALTER TABLE posts DROP COLUMN tags;
ALTER TABLE posts RENAME COLUMN tags_json TO tags;

ALTER TABLE news DROP COLUMN tags;
ALTER TABLE news RENAME COLUMN tags_json TO tags;
