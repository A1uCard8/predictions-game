-- One-time: remove specific admin-created test markets (no external_source).
-- Run in Supabase SQL Editor. Adjust titles if yours differ slightly.
-- Predictions on these rows are CASCADE-deleted per schema.

DELETE FROM public.markets
WHERE external_source IS NULL
  AND (
    title = 'Will a specific bill pass the House this quarter?'
    OR title = 'Will the Fed cut rates before July 1?'
  );

-- If nothing deleted, list candidates:
-- SELECT id, title, category, external_source FROM public.markets ORDER BY created_at DESC LIMIT 20;
