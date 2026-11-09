-- Profiles table (publicly readable, auto-created on signup)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  display_name text,
  avatar_url text
);

-- Safe for existing databases that already have profiles without avatar_url
alter table public.profiles add column if not exists avatar_url text;

-- Must be SECURITY DEFINER with a pinned search_path so auth (supabase_auth_admin)
-- can insert into public.profiles during signup. Unqualified names break when
-- search_path is empty, which causes "Database error saving new user".
-- OAuth (Google/Apple) may omit email or use full_name instead of display_name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@users.noreply'),
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Posts
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  author text not null,
  item text not null,
  address text not null,
  description text not null,
  time timestamptz not null default now(),
  type text not null,
  image_url text not null,
  latitude double precision not null,
  longitude double precision not null,
  exp_date timestamptz not null
);

create table if not exists saved_posts (
  user_id uuid references auth.users not null,
  post_id uuid references posts on delete cascade not null,
  primary key (user_id, post_id)
);

-- Users report whether an item is still on the shelf
create table if not exists stock_votes (
  user_id uuid references auth.users not null,
  post_id uuid references posts on delete cascade not null,
  vote text not null check (vote in ('in_stock', 'sold_out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- Following now uses UUIDs
create table if not exists following (
  follower_id uuid references auth.users not null,
  followed_id uuid references auth.users not null,
  primary key (follower_id, followed_id)
);

create index if not exists posts_time_idx on posts (time desc);
create index if not exists posts_type_idx on posts (type);
create index if not exists posts_item_idx on posts (item);
create index if not exists posts_author_idx on posts (author);
create index if not exists posts_user_id_idx on posts (user_id);

alter table posts enable row level security;
alter table saved_posts enable row level security;
alter table stock_votes enable row level security;
alter table following enable row level security;

drop policy if exists "Posts are viewable by everyone" on posts;
drop policy if exists "Users can insert own posts" on posts;
drop policy if exists "Users can update own posts" on posts;
drop policy if exists "Users can delete own posts" on posts;
create policy "Posts are viewable by everyone" on posts for select using (true);
create policy "Users can insert own posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts" on posts for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own saves" on saved_posts;
drop policy if exists "Users can insert own saves" on saved_posts;
drop policy if exists "Users can delete own saves" on saved_posts;
create policy "Users can view own saves" on saved_posts for select using (auth.uid() = user_id);
create policy "Users can insert own saves" on saved_posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own saves" on saved_posts for delete using (auth.uid() = user_id);

drop policy if exists "Stock votes are viewable by everyone" on stock_votes;
drop policy if exists "Users can insert own stock votes" on stock_votes;
drop policy if exists "Users can update own stock votes" on stock_votes;
drop policy if exists "Users can delete own stock votes" on stock_votes;
create policy "Stock votes are viewable by everyone" on stock_votes for select using (true);
create policy "Users can insert own stock votes" on stock_votes for insert with check (auth.uid() = user_id);
create policy "Users can update own stock votes" on stock_votes for update using (auth.uid() = user_id);
create policy "Users can delete own stock votes" on stock_votes for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own following" on following;
drop policy if exists "Following is viewable by everyone" on following;
drop policy if exists "Users can insert own following" on following;
drop policy if exists "Users can delete own following" on following;
create policy "Following is viewable by everyone" on following for select using (true);
create policy "Users can insert own following" on following for insert with check (auth.uid() = follower_id);
create policy "Users can delete own following" on following for delete using (auth.uid() = follower_id);

-- Storage
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "Images are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;
create policy "Images are publicly accessible"
  on storage.objects for select using (bucket_id = 'images');

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (bucket_id = 'images' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update images" on storage.objects;
create policy "Authenticated users can update images"
  on storage.objects for update
  using (bucket_id = 'images' and auth.role() = 'authenticated');

-- Allow the signed-in user to permanently delete their account + related data.
-- Runs as SECURITY DEFINER so it can remove the auth.users row.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.stock_votes where user_id = uid;
  delete from public.saved_posts where user_id = uid;
  delete from public.following where follower_id = uid or followed_id = uid;
  delete from public.posts where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

-- Realtime (ignore if already added)
do $$ begin
  alter publication supabase_realtime add table posts;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table saved_posts;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table following;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table profiles;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table stock_votes;
exception when duplicate_object then null;
end $$;