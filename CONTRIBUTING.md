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

## プロジェクト構造

```
mirai-gikai-nagoya/
├── app/
│   ├── page.tsx                    # トップページ(全体チャット + 議案カード一覧)
│   ├── layout.tsx                  # 全体レイアウト(ヘッダー・フッター・Context Provider)
│   ├── bill-card.tsx               # トップページの議案カード(クライアント、詳細レベル連動)
│   ├── api/chat/route.ts           # Gemini呼び出しAPI Route(議案別/全体の2モード)
│   ├── furigana-context.tsx        # ふりがな表示ON/OFFの共有状態
│   ├── furigana-text.tsx           # ふりがなセグメント配列を<ruby>で描画するコンポーネント
│   ├── furigana-toggle.tsx         # ヘッダーのふりがなスイッチ
│   ├── detail-level-context.tsx    # 「もっと詳しく」ON/OFFの共有状態
│   ├── detail-level-toggle.tsx     # ヘッダーの「もっと詳しく」スイッチ
│   ├── components/
│   │   ├── switch.tsx              # トグルスイッチの共通UI
│   │   ├── chat-widget.tsx         # AIチャットUI(トップ/議案詳細で共用、billId有無で切替)
│   │   ├── bill-thumbnail.tsx      # サムネイル表示(illustration/photo)
│   │   └── thumbnails/*.tsx        # 自作SVGイラスト(カテゴリ別、budget/childcare/education等)
│   └── bills/[id]/
│       ├── page.tsx                # 議案詳細ページ本体
│       ├── bill-explanation.tsx    # かんたん解説/くわしい解説の表示
│       ├── bill-detail-sections.tsx # ポイント・理由・意見が分かれるところ・影響を受ける人
│       └── status-stepper.tsx      # 提出→審議→成立のステータス表示
├── data/
│   ├── councils.ts                 # 議会マスタ(愛知県議会・名古屋市会、表示順もここで決まる)
│   ├── bills.ts                    # 議案の静的データ本体(型定義もここ)
│   └── explanation-furigana.generated.ts # 自動生成ファイル(直接編集しない)
└── scripts/
    └── generate-explanation-furigana.ts  # ふりがなデータの生成スクリプト
```

## データについて

データはDBを持たず、2種類の静的ファイルで管理している。

| データ | ファイル | 件数 | 作り方 |
|---|---|---|---|
| 議案一覧(直近1年) | `data/agendas.json`(`data/agendas.ts` で型付きで読み込む) | 約450件 | `npm run ingest:agendas` で生成 |
| 注目議案の解説 | `data/bills.ts` | 10件 | 手書き |

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

1. `data/bills.ts` の `Bill` 型に沿ってオブジェクトを追加(`nameFurigana` は漢字部分ごとに
   読みを手動で分割する。ハイフンなしの単語はそのまま、送り仮名や助詞は `reading` を省略する)
2. `tags` ・`thumbnail` (後述)を設定する
3. `npm run generate:furigana` を実行し、`summaryEasy` 等の解説文のふりがなを再生成する
4. `npx tsc --noEmit && npm run build` で確認する

## ふりがな機能

議案名(`nameFurigana`)は手動でセグメント分割しているが、解説文以降の長い文章
(`summaryEasy` / `summaryDetailed` / `keyPoints` / `reasons` / `debatePoints` /
`affectedGroups`)は `kuromoji` による形態素解析で自動生成している
(`scripts/generate-explanation-furigana.ts` → `data/explanation-furigana.generated.ts`)。

- 送り仮名(例:「育てよう」)は漢字部分だけにルビを振るよう、トークンを漢字/非漢字の連続部分に
  分割してから読みを割り当てている。
- kuromoji(IPADIC)は文脈によって誤読することがある(例:「令和」の「令」が単独トークン化
  されると「りょう」になる)。既知の誤読は `FORCED_READINGS` に追記して補正すること。
- **`data/explanation-furigana.generated.ts` は自動生成ファイルなので直接編集しない。**
  `bills.ts` の該当テキストを直接編集し、`npm run generate:furigana` を再実行する。

## サムネイルについて

`data/bills.ts` の `thumbnail` フィールドで議案ごとに指定する。2方式ある。

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
