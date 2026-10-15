-- 初回ログイン時のパスワード変更。
-- 管理画面で自動発行したパスワード(追加・再発行)や、他の管理者が設定したパスワードのときに true にし、
-- 本人がパスワードを変更するまで管理画面を使えないようにする。
-- SQL エディタや npm run admin:create で本人が決めたパスワードは false のまま。
alter table public.admins add column must_change_password boolean not null default false;
