-- Optional: align existing auto-ingested rows with new nav categories (run once if you already have data).
update public.markets set category = 'Valorant' where external_source = 'vlr';
update public.markets set category = 'Pokemon Cards' where external_source = 'tcgdex';
