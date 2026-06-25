-- Profiles table (publicly readable, auto-created on signup)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  display_name text
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

alter table profiles enable row level security;
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

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
alter table following enable row level security;

create policy "Posts are viewable by everyone" on posts for select using (true);
create policy "Users can insert own posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts" on posts for delete using (auth.uid() = user_id);

create policy "Users can view own saves" on saved_posts for select using (auth.uid() = user_id);
create policy "Users can insert own saves" on saved_posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own saves" on saved_posts for delete using (auth.uid() = user_id);

create policy "Users can view own following" on following for select using (auth.uid() = follower_id);
create policy "Users can insert own following" on following for insert with check (auth.uid() = follower_id);
create policy "Users can delete own following" on following for delete using (auth.uid() = follower_id);

-- Storage
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "Images are publicly accessible"
  on storage.objects for select using (bucket_id = 'images');

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (bucket_id = 'images' and auth.role() = 'authenticated');

-- Realtime
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table saved_posts;
alter publication supabase_realtime add table following;
alter publication supabase_realtime add table profiles;