
-- Remove duplicate watch_history entries, keeping only the latest per user+video
DELETE FROM public.watch_history a
USING public.watch_history b
WHERE a.user_id = b.user_id
  AND a.vod_id = b.vod_id
  AND a.watched_at < b.watched_at;

-- Add unique constraint so upsert works correctly
ALTER TABLE public.watch_history ADD CONSTRAINT watch_history_user_vod_unique UNIQUE (user_id, vod_id);
