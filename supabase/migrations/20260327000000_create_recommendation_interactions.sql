-- Create recommendation_likes table
create table if not exists public.recommendation_likes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  unique (recommendation_id, user_id)
);

alter table public.recommendation_likes enable row level security;

create policy "Anyone can view recommendation likes"
  on public.recommendation_likes for select using (true);

create policy "Users can like recommendations"
  on public.recommendation_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike their own likes"
  on public.recommendation_likes for delete
  using (auth.uid() = user_id);

-- Create saved_recommendations table
create table if not exists public.saved_recommendations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_name text not null default 'Favorites',
  notes text,
  unique (recommendation_id, user_id, collection_name)
);

alter table public.saved_recommendations enable row level security;

create policy "Users can view their own saved recommendations"
  on public.saved_recommendations for select
  using (auth.uid() = user_id);

create policy "Users can save recommendations"
  on public.saved_recommendations for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own saved recommendations"
  on public.saved_recommendations for delete
  using (auth.uid() = user_id);
