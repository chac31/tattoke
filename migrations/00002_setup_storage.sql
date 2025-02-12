-- Enable the storage extension if not already enabled
create extension if not exists "storage" schema "extensions";

-- Drop existing bucket if it exists
do $$
begin
    if exists (
        select 1
        from storage.buckets
        where id = 'tattogenerator'
    ) then
        delete from storage.buckets where id = 'tattogenerator';
    end if;
end $$;

-- Create a bucket for tattoo designs with public access
insert into storage.buckets (id, name, public)
values ('tattogenerator', 'tattogenerator', true);

-- Drop existing policies if they exist
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Allow public select access" on storage.objects;
drop policy if exists "Allow authenticated insert access" on storage.objects;
drop policy if exists "Allow authenticated update access" on storage.objects;
drop policy if exists "Allow authenticated delete access" on storage.objects;
drop policy if exists "Allow full access to authenticated users" on storage.objects;
drop policy if exists "Allow public read access" on storage.objects;

-- Enable RLS
alter table storage.objects enable row level security;

-- Set up storage policies
create policy "Allow authenticated users all access"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'tattogenerator')
  with check (bucket_id = 'tattogenerator');

create policy "Allow public read and list access"
  on storage.objects
  for select
  to public
  using (bucket_id = 'tattogenerator');

-- Reset permissions
revoke all privileges on all tables in schema storage from public, authenticated;
revoke all privileges on all routines in schema storage from public, authenticated;
revoke all privileges on all sequences in schema storage from public, authenticated;

-- Grant base permissions
grant usage on schema storage to public, authenticated;

-- Grant bucket permissions
grant all privileges on storage.buckets to authenticated;
grant select on storage.buckets to public;

-- Grant object permissions
grant all privileges on storage.objects to authenticated;
grant select on storage.objects to public;

-- Additional permissions for listing objects
grant execute on function storage.foldername to public, authenticated;
grant execute on function storage.filename to public, authenticated;
grant execute on function storage.extension to public, authenticated; 