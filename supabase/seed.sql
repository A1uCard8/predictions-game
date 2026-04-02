-- Optional sample markets (run after schema.sql)
insert into public.markets (title, description, category, options, close_date, resolution_date, status)
values
  (
    'Will the Fed cut rates before July 1?',
    'Based on FOMC actions and forward guidance as reported by major outlets.',
    'Finance/Markets',
    '["Yes", "No"]'::jsonb,
    now() + interval '30 days',
    now() + interval '45 days',
    'open'
  ),
  (
    'Will a specific bill pass the House this quarter?',
    'Resolution by official roll call result.',
    'Politics',
    '["Yes", "No"]'::jsonb,
    now() + interval '20 days',
    now() + interval '35 days',
    'open'
  );
