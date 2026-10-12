// 現在の静的データ(lib/bills/static.ts)から、DB の初期データ db/seed.sql を作る。
// 実行: npm run db:seed:generate
// npm run db:migrate -- --seed で流す(本番の Neon にも同じコマンドか SQL エディタで1回だけ流す)。

import fs from "node:fs";
import path from "node:path";
import { staticBillRecords } from "../lib/bills/static";

const rows = staticBillRecords.map((b) => ({
  slug: b.slug,
  council: b.council,
  session_name: b.sessionName,
  bill_number: b.billNumber,
  name: b.name,
  status: b.status,
  committee: b.committee,
  submitted_date: b.submittedDate,
  decided_date: b.decidedDate,
  source_url: b.sourceUrl,
  minutes_text: b.minutesText,
  summary_easy: b.summaryEasy,
  summary_detailed: b.summaryDetailed,
  key_points: b.keyPoints,
  reasons: b.reasons,
  debate_points: b.debatePoints,
  affected_groups: b.affectedGroups,
  tags: b.tags,
  thumbnail: b.thumbnail,
  furigana: b.furigana,
  publish_status: b.publishStatus,
  is_review_completed: b.isReviewCompleted,
  display_order: b.displayOrder,
}));

// JSON を1つの文字列リテラルとして埋め込み、jsonb_populate_recordset で行に展開する
const json = JSON.stringify(rows).replace(/'/g, "''");
const sql = `-- 自動生成ファイル(npm run db:seed:generate)。手で編集しない。
-- 既存の静的データ(解説付きの注目議案 ${rows.length}件)を bills テーブルに入れる。
insert into public.bills (
  slug, council, session_name, bill_number, name, status, committee,
  submitted_date, decided_date, source_url, minutes_text, summary_easy, summary_detailed,
  key_points, reasons, debate_points, affected_groups, tags, thumbnail, furigana,
  publish_status, is_review_completed, display_order
)
select
  slug, council, session_name, bill_number, name, status, committee,
  submitted_date, decided_date, source_url, minutes_text, summary_easy, summary_detailed,
  key_points, reasons, debate_points, affected_groups, tags, thumbnail, furigana,
  publish_status, is_review_completed, display_order
from jsonb_populate_recordset(null::public.bills, '${json}'::jsonb)
on conflict (slug) do nothing;
`;

const outPath = path.join(process.cwd(), "db/seed.sql");
fs.writeFileSync(outPath, sql, "utf-8");
console.log(`Wrote ${outPath} (${rows.length} bills)`);
