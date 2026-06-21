-- Remove automatic reading-time metadata from posts and news.
ALTER TABLE public.posts DROP COLUMN IF EXISTS reading_time_min;
ALTER TABLE public.news DROP COLUMN IF EXISTS reading_time_min;
