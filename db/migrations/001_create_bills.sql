-- 議案(解説付きで掲載する注目議案)のテーブル。
-- 読み書きはサーバー(lib/db.ts の接続)からだけ行い、認可はアプリ側(proxy.ts と requireAdmin)で行う。

create type bill_status as enum (
  'introduced',   -- 提出済み(上程)
  'in_committee', -- 委員会で審査中
  'in_plenary',   -- 本会議で審議中
  'enacted',      -- 可決
  'amended',      -- 修正可決
  'rejected',     -- 否決
  'continued'     -- 継続審査
);

create type bill_publish_status as enum ('draft', 'published');

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  -- 公開サイトの URL(/bills/[slug])に使う識別子
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  council text not null check (council in ('aichi_pref', 'nagoya_city')),
  session_name text not null,
  bill_number text not null,
  name text not null check (char_length(name) between 1 and 300),
  status bill_status not null default 'introduced',
  committee text not null default '',
  submitted_date date,
  decided_date date,
  source_url text,
  minutes_text text not null default '',
  summary_easy text not null default '',
  summary_detailed text not null default '',
  key_points jsonb not null default '[]',      -- [{ title, body }]
  reasons jsonb not null default '[]',         -- [{ title, body }]
  debate_points jsonb not null default '[]',   -- [{ topic, benefit, caution }]
  affected_groups jsonb not null default '[]', -- [{ who, effect }]
  tags text[] not null default '{}',
  thumbnail jsonb,                             -- { type: 'illustration', illustration } | { type: 'photo', keyword, fallback }
  -- 保存時にサーバーで生成するふりがな(議案名・解説文・各セクション)
  furigana jsonb not null default '{}',
  publish_status bill_publish_status not null default 'draft',
  is_review_completed boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (decided_date is null or submitted_date is null or decided_date >= submitted_date)
);

create index bills_council_idx on public.bills (council, display_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bills_set_updated_at
before update on public.bills
for each row execute function public.set_updated_at();

