/*
create table boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bg_color text default '#0079BF',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table lists (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade,
  title text not null,
  position integer default 0,
  created_at timestamptz default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references lists(id) on delete cascade,
  title text not null,
  description text default '',
  due_date date,
  labels text[] default '{}',
  checklist jsonb default '[]',
  assignee text default '',
  position integer default 0,
  created_at timestamptz default now()
);

alter table boards enable row level security;
alter table lists enable row level security;
alter table cards enable row level security;

create policy "auth users full access boards" on boards for all using (auth.role() = 'authenticated');
create policy "auth users full access lists" on lists for all using (auth.role() = 'authenticated');
create policy "auth users full access cards" on cards for all using (auth.role() = 'authenticated');
*/
