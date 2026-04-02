-- Storage: create bucket "avatars" in Dashboard (public) OR:
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Authenticated users can upload to their own folder: avatars/{userId}/...
create policy "Avatar upload own"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text);

create policy "Avatar update own"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text);

create policy "Avatar read public"
on storage.objects for select
to public
using (bucket_id = 'avatars');
