-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Drop existing objects
drop policy if exists "Users can view own images" on generated_images;
drop policy if exists "Users can insert own images" on generated_images;
drop policy if exists "Users can delete own images" on generated_images;
drop table if exists generated_images;

-- Create the table
create table public.generated_images (
    id uuid primary key default uuid_generate_v4(),
    user_id text not null,
    url text not null,
    prompt text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create indexes
create index generated_images_user_id_idx on public.generated_images(user_id);
create index generated_images_created_at_idx on public.generated_images(created_at desc);

-- Enable RLS
alter table public.generated_images enable row level security;

-- Create policies
create policy "Users can view own images"
    on public.generated_images for select
    using (auth.uid()::text = user_id);

create policy "Users can insert own images"
    on public.generated_images for insert
    with check (auth.uid()::text = user_id);

create policy "Users can delete own images"
    on public.generated_images for delete
    using (auth.uid()::text = user_id);

-- Create update trigger for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_generated_images_updated_at
    before update on public.generated_images
    for each row
    execute function update_updated_at_column();

-- Grant permissions
grant usage on schema public to authenticated, anon;
grant all on public.generated_images to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Ensure the function can be executed
grant execute on function update_updated_at_column() to authenticated; 