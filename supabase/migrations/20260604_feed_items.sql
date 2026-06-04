-- ─────────────────────────────────────────────────────────────────────────────
-- feed_items  (social feed entries)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists feed_items (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('workout', 'session')),
  actor_id      uuid not null references auth.users(id) on delete cascade,
  actor_name    text not null default '',
  actor_username text,
  title         text not null default '',
  subtitle      text not null default '',
  share_message text,
  reaction_count int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists feed_items_actor_created
  on feed_items (actor_id, created_at desc);

alter table feed_items enable row level security;

-- Anyone authenticated can read feed items (filtered in app by friendships)
create policy "feed_items_select"
  on feed_items for select
  using (auth.role() = 'authenticated');

-- Only the actor can insert/delete their own items
create policy "feed_items_insert"
  on feed_items for insert
  with check (auth.uid() = actor_id);

create policy "feed_items_delete"
  on feed_items for delete
  using (auth.uid() = actor_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- feed_comments
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists feed_comments (
  id            uuid primary key default gen_random_uuid(),
  feed_item_id  uuid not null references feed_items(id) on delete cascade,
  author_id     uuid not null references auth.users(id) on delete cascade,
  author_name   text not null default '',
  author_username text,
  content       text not null,
  created_at    timestamptz not null default now()
);

create index if not exists feed_comments_item
  on feed_comments (feed_item_id, created_at asc);

alter table feed_comments enable row level security;

create policy "feed_comments_select"
  on feed_comments for select
  using (auth.role() = 'authenticated');

create policy "feed_comments_insert"
  on feed_comments for insert
  with check (auth.uid() = author_id);

create policy "feed_comments_delete"
  on feed_comments for delete
  using (auth.uid() = author_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- feed_reactions  (replaces the reaction_count int — proper per-user tracking)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists feed_reactions (
  id            uuid primary key default gen_random_uuid(),
  feed_item_id  uuid not null references feed_items(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (feed_item_id, user_id)
);

alter table feed_reactions enable row level security;

create policy "feed_reactions_select"
  on feed_reactions for select
  using (auth.role() = 'authenticated');

create policy "feed_reactions_insert"
  on feed_reactions for insert
  with check (auth.uid() = user_id);

create policy "feed_reactions_delete"
  on feed_reactions for delete
  using (auth.uid() = user_id);

-- Keep reaction_count in sync via trigger
create or replace function sync_reaction_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update feed_items set reaction_count = reaction_count + 1 where id = NEW.feed_item_id;
  elsif TG_OP = 'DELETE' then
    update feed_items set reaction_count = greatest(reaction_count - 1, 0) where id = OLD.feed_item_id;
  end if;
  return null;
end;
$$;

create trigger trg_reaction_count
after insert or delete on feed_reactions
for each row execute function sync_reaction_count();
