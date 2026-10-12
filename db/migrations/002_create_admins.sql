-- 管理画面のログイン用。パスワードは pgcrypto の crypt()(bcrypt)で保存し、照合も DB で行う。
-- Neon の SQL エディタから直接管理者を追加できる:
--   insert into admins (email, password_hash) values ('you@example.com', crypt('パスワード', gen_salt('bf')));

create extension if not exists pgcrypto;

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+$'),
  password_hash text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- 大文字・小文字の違いで同じメールアドレスを二重に登録しない
create unique index admins_email_key on public.admins (lower(email));

-- ログイン中のセッション。Cookie にはランダムなトークンを入れ、DB にはその SHA-256 だけを保存する
create table public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admins (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index admin_sessions_expires_idx on public.admin_sessions (expires_at);
