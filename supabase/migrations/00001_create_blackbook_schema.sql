-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Folders table
create table public.folders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  parent_id uuid references public.folders on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notes table
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  folder_id uuid references public.folders on delete cascade not null,
  title text default 'Untitled Note',
  blocks jsonb default '[]'::jsonb,
  knowledge_links jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Shared notes table (snapshots)
create table public.shared_notes (
  id uuid default uuid_generate_v4() primary key,
  share_id text unique not null,
  original_note_id uuid references public.notes on delete set null,
  owner_id uuid references auth.users on delete set null,
  title text not null,
  blocks jsonb not null,
  knowledge_links jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index folders_user_id_idx on public.folders(user_id);
create index notes_user_id_idx on public.notes(user_id);
create index notes_folder_id_idx on public.notes(folder_id);
create index shared_notes_share_id_idx on public.shared_notes(share_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.notes enable row level security;
alter table public.shared_notes enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Folders policies
create policy "Users can view their own folders"
  on public.folders for select
  using (auth.uid() = user_id);

create policy "Users can create their own folders"
  on public.folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own folders"
  on public.folders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own folders"
  on public.folders for delete
  using (auth.uid() = user_id);

-- Notes policies
create policy "Users can view their own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can create their own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- Shared notes policies (public read access)
create policy "Shared notes are viewable by everyone"
  on public.shared_notes for select
  using (true);

create policy "Authenticated users can create shared notes"
  on public.shared_notes for insert
  with check (auth.uid() = owner_id);

-- Function to create default folders for new users
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
  
  -- Create default folders
  insert into public.folders (user_id, name, parent_id)
  values
    (new.id, 'Inbox', null),
    (new.id, 'Projects', null),
    (new.id, 'Ideas', null),
    (new.id, 'Archive', null);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();