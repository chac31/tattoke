-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint email_unique unique (email)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a trigger to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a table for generated images
create table if not exists public.generated_images (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  url text not null,
  prompt text not null,
  timestamp bigint not null,
  created_at timestamptz default now()
);

-- Set up RLS for generated_images
alter table public.generated_images enable row level security;

-- Create policies for generated_images
create policy "Users can view their own generated images."
  on generated_images for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own generated images."
  on generated_images for insert
  with check ( auth.uid() = user_id ); 