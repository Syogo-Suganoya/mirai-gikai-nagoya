# デプロイ手順書 — Vercel

必要なアカウントは Vercel と Google AI Studio(Gemini APIキー発行用)の2つ。どちらも無料枠で足りる。

| 役割 | サービス | 費用 |
| :--- | :--- | :--- |
| アプリ本体(Next.js) | Vercel | Hobbyプラン(無料)内 |
| AIチャット | Google Gemini API(`gemini-2.5-flash`) | 無料枠内(小規模利用) |

> **なぜこの構成か**: 議案データ(`data/bills.ts`)はDBを持たずビルド時に埋め込む静的TSファイルで、
> 議案一覧・詳細ページは `generateStaticParams` で静的生成(SSG)される。動的な処理はAIチャット
> (`/api/chat`)のみで、これはNext.jsのAPI Route(Vercelのサーバーレス関数)で完結するため、
> Next.js本体以外の独立したバックエンド(Docker等)は不要。

## 全体の流れ

```
1. Gemini APIキーを発行する    → GOOGLE_GENERATIVE_AI_API_KEY を取得
2. ローカルでビルド確認する      → npm run build が通ることを確認
3. Vercelにデプロイする         → 公開URLが発行される
4. 環境変数を設定する           → Vercel側にAPIキーを登録
5. 動作確認
```

**注意**: `data/bills.ts` の解説文(`summaryEasy` / `summaryDetailed`)やキーポイント等を編集した場合は、
ふりがなデータが古いままになるため `npm run generate:furigana` を実行してから再デプロイすること
(詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照)。

## 手順1: Gemini APIキーの発行(初回のみ、約2分)

1. https://aistudio.google.com/apikey を開き、Googleアカウントでログイン
2. 「Create API key」で新しいキーを発行
3. 発行されたキーを控える(この後 Vercel の環境変数に設定する)

## 手順2: ローカルでビルド確認(約1分)

```bash
npm install
npx tsc --noEmit
npm run build
```

エラーなく完了することを確認する。`.env.local` にAPIキーを設定すれば、ローカルの `npm run dev`
(http://localhost:3000)でAIチャットも含めて動作確認できる。

```bash
cp .env.local.example .env.local
# .env.local の GOOGLE_GENERATIVE_AI_API_KEY= に手順1で発行したキーを貼り付ける
```

## 手順3: Vercelへのデプロイ

### Web UIから(初回・GUI操作でよい場合)

1. https://vercel.com/new を開き、GitHubリポジトリ(このプロジェクトを含むリポジトリ)を選択
2. Root Directory に `mirai-gikai-nagoya` を指定
   (モノレポの一部なので、リポジトリ直下ではなくこのディレクトリを明示する)
3. Framework Preset は自動で「Next.js」が検出される
4. 環境変数(Environment Variables)に以下を追加してから Deploy
   - `GOOGLE_GENERATIVE_AI_API_KEY` = 手順1で発行したキー

### Vercel CLIから

```bash
npm install -g vercel
cd mirai-gikai-nagoya
vercel                     # 初回: プロジェクトのリンク・設定を対話形式で行う
vercel env add GOOGLE_GENERATIVE_AI_API_KEY   # 環境変数を追加(Production/Preview/Development を選択)
vercel --prod              # 本番デプロイ
```

実行結果に表示される **Production URL**(`https://<プロジェクト名>.vercel.app` など)を控える。

## 手順4: デプロイ後の確認

発行されたURLを開き、以下を確認する。

| 画面 | 確認内容 |
| :--- | :--- |
| `/` トップ | 愛知県議会・名古屋市会それぞれの議案カードが表示され、全体チャットが動く |
| `/bills/[id]` 詳細 | ヒーロー画像・ステータス・かんたん/くわしい解説・ポイント等のセクションが表示される |
| ヘッダーのスイッチ | 「もっと詳しく」「ふりがな」を切り替えると表示が変わる |
| 議案ごとのAIチャット | 質問すると、その議案の会議録・解説を踏まえた回答が返る(**APIキー未設定だとここだけ失敗する**) |

## デプロイ後の運用

### 議案データを追加・編集する

1. `data/bills.ts` を編集(新規議案の追加、解説文の修正など)
2. ふりがなデータを再生成: `npm run generate:furigana`
3. `npx tsc --noEmit && npm run build` で確認
4. コミット・プッシュ(Vercelと連携していれば自動で再デプロイされる)

### APIキーを更新する

Vercelプロジェクトの Settings → Environment Variables から
`GOOGLE_GENERATIVE_AI_API_KEY` を更新し、再デプロイ(Redeploy)する。
