-- Create the bucket 'chef-documents' if it doesn't exist
insert into storage.buckets (id, name, public)
values ('chef-documents', 'chef-documents', true)
on conflict (id) do nothing;

-- Policy 1: Allow public read access (so anyone can view the images)
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'chef-documents' );

-- Policy 2: Allow authenticated users to upload files
drop policy if exists "Authenticated Uploads" on storage.objects;
create policy "Authenticated Uploads"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'chef-documents' );

-- Policy 3: Allow users to update/delete their own files (owner matches auth.uid())
drop policy if exists "User Update Own Files" on storage.objects;
create policy "User Update Own Files"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'chef-documents' and auth.uid() = owner );

drop policy if exists "User Delete Own Files" on storage.objects;
create policy "User Delete Own Files"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'chef-documents' and auth.uid() = owner );
