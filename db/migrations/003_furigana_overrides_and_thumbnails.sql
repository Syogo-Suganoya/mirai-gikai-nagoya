-- ふりがなの手動修正と、サムネイル画像のアップロード。

-- 議案ごとの読みの修正 [{ text, reading }]。保存時に kuromoji の結果へ上書きする(reading が空ならふりがなを付けない)
alter table public.bills add column furigana_overrides jsonb not null default '[]';

-- アップロードしたサムネイル画像(1議案1枚)。無い議案は bills.thumbnail のデフォルト表示になる。
-- 画像は管理画面で縮小してから送るので小さい(数百KB)。外部ストレージを増やさないよう DB に入れる
create table public.bill_thumbnails (
  bill_id uuid primary key references public.bills (id) on delete cascade,
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  data bytea not null check (octet_length(data) <= 2 * 1024 * 1024),
  updated_at timestamptz not null default now()
);
