# 開発ガイド

「みらい議会」(https://gikai.team-mir.ai/ , [team-mirai/mirai-gikai](https://github.com/team-mirai/mirai-gikai))
のUI・データモデルの考え方を参考にした、名古屋市会・愛知県議会向けの非公式な個人制作サイトです。

## クイックスタート

```bash
npm install
cp .env.local.example .env.local   # GOOGLE_GENERATIVE_AI_API_KEY を設定するとAIチャットも動く
npm run dev                         # http://localhost:3000
```

Gemini APIキーは https://aistudio.google.com/apikey で無料発行できる。

DB(`DATABASE_URL`)を設定しなくても公開サイトは動く(議案は静的データ `data/bills.ts` から表示する)。
管理画面(`/admin`)を使うときは、下の「管理画面」の手順でローカルの PostgreSQL を起動する。
本番(Vercel + Neon)へのデプロイと DB の追加手順は [_memo/DEPLOY.md](./_memo/DEPLOY.md) を参照。

## プロジェクト構造

```
mirai-gikai-nagoya/
├── proxy.ts                        # /admin の入口チェック(ログインの Cookie がなければログイン画面へ)
├── docker-compose.yml              # ローカル開発用の PostgreSQL
├── app/
│   ├── layout.tsx                  # 全体の外枠(フォント・Context Provider)
│   ├── (site)/                     # 公開サイト(URL には出ないグループ)
│   │   ├── layout.tsx              # 公開サイトのヘッダー・フッター
│   │   ├── page.tsx                # トップページ(全体チャット + 議案カード一覧)
│   │   ├── bills/[id]/             # 議案詳細ページ([id] は slug)
│   │   └── councils/[council]/     # 議会ごとの議案一覧ページ
│   ├── admin/                      # 管理画面
│   │   ├── actions.ts              # Server Actions(保存・公開切替・複製・削除・CSV取り込み)
│   │   ├── login/                  # ログイン画面
│   │   └── (authed)/               # ログイン後の画面(議案管理・新規/編集・議案一覧から作成・CSV)
│   ├── api/chat/route.ts           # Gemini呼び出しAPI Route(議案別/全体の2モード)
│   ├── bill-card.tsx               # トップページの議案カード
│   ├── furigana-*.tsx / detail-level-*.tsx  # ふりがな・「もっと詳しく」の切り替え
│   └── components/                 # チャット・サムネイル・トグルスイッチなど
├── lib/
│   ├── bills/                      # 議案の型・DBアクセス(repository)・公開サイト用の読み込み(queries)・フォームのスキーマ・CSV
│   ├── admins/repository.ts        # 管理者の一覧・追加・パスワード変更・削除
│   ├── auth/admin.ts               # ログイン・セッション・管理者の判定(requireAdmin)
│   ├── db.ts                       # DB の接続(DATABASE_URL)
│   ├── furigana.ts                 # kuromoji によるふりがな生成
│   └── csv.ts                      # CSV の読み書き
├── data/
│   ├── councils.ts                 # 議会マスタ(表示順もここで決まる)
│   ├── bills.ts                    # 注目議案の静的データ(DB 未設定時の表示と、DB の初期データの元)
│   ├── agendas.json / agendas.ts   # 議案一覧(直近1年)
│   └── raw/aichi/*.tsv             # 愛知県議会の議案表のスナップショット
├── db/
│   ├── migrations/                 # テーブル定義(npm run db:migrate で番号順に流す)
│   └── seed.sql                    # 初期データ(自動生成。手で編集しない)
└── scripts/                        # 議案一覧の取得・ふりがな生成・初期データ生成・マイグレーション・管理者作成
```

## データについて

| データ | 置き場所 | 件数 | 作り方 |
|---|---|---|---|
| 議案一覧(直近1年) | `data/agendas.json`(`data/agendas.ts` で型付きで読み込む) | 約450件 | `npm run ingest:agendas` で生成 |
| 注目議案の解説 | DB(PostgreSQL)の `bills` テーブル | 10件〜 | 管理画面で作成・編集 |

注目議案は DB に置き、公開サイトは「公開中」の議案だけを読む(`lib/bills/queries.ts`)。
DB は本番が Neon、ローカルが Docker の PostgreSQL で、どちらも `DATABASE_URL` で指定する。
`DATABASE_URL` が未設定のときは、代わりに静的データ `data/bills.ts` を表示する。

### 議案一覧を更新する(`npm run ingest:agendas`)

`scripts/ingest-agendas.ts` が、直近12か月に開かれた定例会・臨時会の議案一覧をまとめて
`data/agendas.json` に書き出す(ふりがなもここで生成する)。`data/agendas.json` は手で編集しない。

- **名古屋市会**: 市公式サイトの「議案の審議経過・結果」(市長提出案件・議員提出議案)を取得して
  表を解析する。robots.txt で許可されている範囲で、1.5秒間隔でアクセスする。
- **愛知県議会**: 県公式サイトはスクリプトからのアクセスにボット判定(Incapsula)を返すため、
  **自動取得しない(ボット判定の回避もしない)**。ブラウザで各定例会の日程ページ
  (`https://www.pref.aichi.jp/site/gikai/nittei-YYMM.html`)を開き、議案表を
  `data/raw/aichi/rYY-MM.tsv` に保存する。形式は既存ファイルと同じで、先頭の `# session` /
  `# url` / `# fetched` 行と、「議案番号・議案名・付託委員会・議決結果」のタブ区切り。
  新しい定例会が開かれたらTSVを1つ追加し、古いものは期間外になったら削除してよい。
- **会議録は取得しない**: 名古屋(kaigiroku.net)はデータAPI(`/dnp/`)、愛知(pref.aichi.dbsr.jp)は
  トップページ以外が robots.txt で禁止されている。画面からは各議会の会議録検索へリンクする。
- 注目議案(`data/bills.ts`)と同じ議案は `featuredBillId` で紐づき、一覧から解説ページへリンクされる。

議案の選定は、議案一覧ページの件名をそのまま議会の会議録検索サービス
(名古屋: kaigiroku.net / 愛知: pref.aichi.dbsr.jp)にかけ、**実際にヒットする(≒個別に
審査・議決された)議案**から選んでいる。軽微な条例の一部改正案などは一括上程・一括採決され
個別の発言記録がほとんど残らないため、予算案・新設条例・修正可決案を優先している。

**内容執筆の方針**: `summaryEasy` / `summaryDetailed` / `keyPoints` / `reasons` /
`debatePoints` / `affectedGroups` は、会議録・審査結果報告書などで実際に確認できた事実のみを
根拠に書き、予算の詳細な内訳や条例の細かい運用ルールなど公式資料でしか確認できない部分は断定を
避け、「公式サイトで確認できます」と案内する書き方にしている。新しい議案を追加する際もこの方針
を踏襲すること。

### 議案を追加・編集する

管理画面(`/admin`)で行う。詳しくは下の「管理画面」を参照。

## 管理画面

`/admin` で、注目議案の作成・編集・公開の切り替えを行う。ログインは簡易方式で、`admins` テーブルの
メールアドレスとパスワードで入る。

- パスワードは PostgreSQL の `pgcrypto`(`crypt()`/bcrypt)でハッシュ化して保存し、照合も DB で行う。
  そのため Neon の SQL エディタから `insert` 1行で管理者を追加できる(_memo/DEPLOY.md の手順5)。
- ログインすると、ランダムなトークンを `admin_session` Cookie(httpOnly)に入れ、DB の `admin_sessions`
  にはその SHA-256 だけを保存する。ログアウト・パスワード変更・管理者の削除で、そのセッションは即座に無効になる。
- 入口の `proxy.ts` は Cookie の有無だけを見る。本当に有効なセッションかは、管理画面のレイアウトと
  各 Server Action の `requireAdmin()` で DB と照合して確かめる。

| 画面 | URL | できること |
|---|---|---|
| 議案管理 | `/admin` | 一覧・議会で絞り込み・並べ替え・公開/下書きの切り替え・レビュー完了・複製・削除 |
| 新規作成 | `/admin/bills/new` | 基本情報・解説・4つのセクションを入力して下書きを作る |
| 編集 | `/admin/bills/[id]/edit` | 同じフォームで編集。保存すると公開サイトにすぐ反映される。サムネイル画像のアップロードと、ふりがなの修正もここで行う |
| 議案一覧から作成 | `/admin/agendas` | 取得済みの議案一覧から選び、議案名・番号・委員会・議決結果を入力済みの状態で新規作成。チェックを付けた議案を件名のみの下書きとしてまとめて登録もできる |
| CSVインポート | `/admin/import` | CSV でまとめて登録・更新(確認画面でエラーの行を確かめてから取り込む) |
| 管理者 | `/admin/admins` | 管理者の一覧・追加・パスワード変更・削除(自分自身と最後の1人は削除できない) |

- 新しく作った議案・複製した議案・CSV で作った議案は**下書き**になり、公開サイトには出ない。
- レビュー未完了の議案は、公開サイトで「内容を確認している途中です」と表示される。
- 4つのセクション(この法律のポイント など)は、それぞれの「✨ AIで生成」ボタンで、フォームに入力中の
  解説・会議録の要約をもとに Gemini が下書きを作る(`lib/bills/generate.ts`)。今の行と置きかわるだけで
  保存はされないので、確認・修正してから保存する。`GOOGLE_GENERATIVE_AI_API_KEY` が必要。
- ふりがなは、編集画面の「ふりがな」で語ごとに確認し、違う読みを修正できる。修正は議案の
  `furigana_overrides` 列に「語 → 読み」として保存し、保存のたびに kuromoji の結果へ上書きする
  (`lib/furigana.ts` の `applyFuriganaOverrides`)。語の区切りが違う場合は、長い語(例: 名古屋市会)を追加すると
  その語全体に読みが付く。自動の語の途中で区切られた部分は、読みがずれるのでふりがな無しになる。
- 保存すると、ふりがなをサーバーで自動生成して DB に入れる(`npm run generate:furigana` は不要)。
- 保存・公開切り替えのたびに公開サイトのキャッシュ(タグ `bills`)を消すので、すぐ反映される。

### ローカルで使う

Docker が必要。`.env.local` の `DATABASE_URL` を `postgres://postgres:postgres@127.0.0.1:5439/mirai_gikai` にしておく。

```bash
npm run db:up                              # PostgreSQL を起動(docker-compose.yml)
npm run db:migrate -- --seed               # テーブルを作り、初期データ(10件)を入れる
npm run admin:create -- you@example.com    # 管理者を作る(パスワードは実行中に入力)
npm run dev                                # http://localhost:3000/admin
```

- DB を初期状態に戻す: `npm run db:reset`(DB を作り直し、マイグレーションと初期データを流し直す)
- 初期データを作り直す: `npm run db:seed:generate`(`data/bills.ts` から `db/seed.sql` を作る)
- DB の中身を見る: `docker compose exec db psql -U postgres -d mirai_gikai`
- テーブルを変えるときは `db/migrations/` に次の番号の SQL を追加して `npm run db:migrate`

本番(Vercel + Neon)の設定は [_memo/DEPLOY.md](./_memo/DEPLOY.md) を参照。

### CSV の形式

1行目に列名(`slug`・`council`・`session_name`・`bill_number`・`name`・`status`・`committee`・
`submitted_date`・`decided_date`・`source_url`・`summary_easy`・`summary_detailed`・`minutes_text`・
`tags`)を書く。列の順番は自由で、必須は `slug` だけ。ひな形は管理画面からダウンロードできる。

- 新しい slug の行は下書きとして作成する(議会・会期・議案番号・議案名が必要)
- 既存の slug の行は、値が入っているセルだけを上書きする(空欄は変更しない)
- 「この法律のポイント」などのセクションは CSV では扱わない(取り込み後に編集画面で入力する)
- `council` は `aichi_pref`/`nagoya_city` か「愛知県議会」「名古屋市会」、`status` は
  `enacted` などの値か「可決」「修正可決」などの表示名で書ける

## ふりがな機能

ふりがなは `kuromoji` による形態素解析で自動生成している(`lib/furigana.ts`)。

- 管理画面で保存した議案: 保存時にサーバーで議案名・解説文・各セクションのふりがなを作り、
  DB の `furigana` 列に入れる。
- 静的データ(`data/bills.ts`): 議案名は手動で分割、解説文以降は `npm run generate:furigana` で
  `data/explanation-furigana.generated.ts` を作る。
- 議案一覧: `npm run ingest:agendas` の中で作る。

- 送り仮名(例:「育てよう」)は漢字部分だけにルビを振るよう、トークンを漢字/非漢字の連続部分に
  分割してから読みを割り当てている。
- kuromoji(IPADIC)は文脈によって誤読することがある(例:「令和」の「令」が単独トークン化
  されると「りょう」になる)。既知の誤読は `FORCED_READINGS` に追記して補正すること。
- **`data/explanation-furigana.generated.ts` は自動生成ファイルなので直接編集しない。**
- Vercel では、管理画面の関数にだけ kuromoji の辞書(約17MB)を含めている(`next.config.ts` の
  `outputFileTracingIncludes`)。

## サムネイルについて

編集画面でアップロードした画像があればそれを表示し、無ければ DB の `thumbnail` 列(jsonb)の
デフォルト表示になる。

- アップロードした画像は `bill_thumbnails` テーブルに入れ、`/bill-thumbnails/[議案ID]?v=[更新時刻]` で返す
  (`app/bill-thumbnails/[id]/route.ts`)。下書きの議案の画像は、ログイン中の管理者にだけ返す。
  画像はブラウザで縮小してから送り、サーバーでも中身の先頭バイトで JPEG・PNG・WebP か確かめる。
- デフォルト表示(`thumbnail` 列)は管理画面では編集できないので、変えるときは SQL で直接更新する
  (編集画面で保存しても、今の値はそのまま残る)。2方式ある。

```ts
{ type: "illustration"; illustration: "budget" | "childcare" | "education" | "community" | "organization" }
{ type: "photo"; keyword: string }  // loremflickr.com にキーワードを渡して関連写真を取得
```

- `photo` はダウンロード不要で手軽だが、個々の写真は選べず議題と無関係な画像が返ることがある。
  新しい議案を `photo` にする場合は、実際にブラウザで表示して内容と合っているか確認し、
  的外れな場合は `illustration` に切り替えること(新しいカテゴリが必要なら
  `app/components/thumbnails/` にSVGを追加し、`BillIllustration` 型と
  `app/components/bill-thumbnail.tsx` の `illustrations` マップに登録する)。
- イラストは配色をカテゴリごとに変える(budget=amber、childcare=rose、education=blue、
  community=emerald、organization=violet)。新規追加時も既存と被らない配色にすること。

## AIチャットについて

`app/api/chat/route.ts` が Gemini(`gemini-3.6-flash`)を呼び出す。ベクトルRAGは使わず、
議案の全文(`summaryEasy` / `summaryDetailed` / `minutesText`)をシステムプロンプトに
そのまま埋め込む方式(みらい議会と同様の考え方)。

- `billId` を渡すと、その議案に絞ったコンテキストで回答する(議案詳細ページ)
- `billId` を渡さない場合は、全議案の一覧をコンテキストにした一般モードになる(トップページ)

## 表示順序について

議会・議案の表示順は「愛知県議会 → 名古屋市会」で統一している。`data/councils.ts` の配列順が
そのまま表示順になるため、順序を変える場合はここを直せば `page.tsx` 等の呼び出し側の並びも
揃える必要がある(ヘッダーロゴ・トップページの見出し文言・チャットの案内文にも同じ順序で
言及しているため、順序を変える際はこれらのテキストも合わせて直すこと)。

## ビルド・型チェック

```bash
npx tsc --noEmit
npm run lint
npm run build
```
