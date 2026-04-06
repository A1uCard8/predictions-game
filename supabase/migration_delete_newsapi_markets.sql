-- One-time cleanup: remove markets created by the legacy NewsAPI ingest.
-- NewsAPI is no longer used in lib/full-ingest.ts.
-- Run in Supabase SQL Editor when you are ready (predictions on these rows are CASCADE-deleted).

DELETE FROM public.markets
WHERE external_source = 'newsapi';
