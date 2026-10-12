import "server-only";

import type { PostgresError } from "postgres";
import { getSql } from "@/lib/db";
import { buildBillFurigana } from "./furigana";
import { toInput } from "./input";
import type { BillFurigana, BillInput, BillRecord, PublishStatus } from "./types";

// bills テーブルの1行(DB の列名)
type BillRow = {
  id: string;
  slug: string;
  council: BillRecord["council"];
  session_name: string;
  bill_number: string;
  name: string;
  status: BillRecord["status"];
  committee: string;
  submitted_date: string | null;
  decided_date: string | null;
  source_url: string | null;
  minutes_text: string;
  summary_easy: string;
  summary_detailed: string;
  key_points: BillRecord["keyPoints"];
  reasons: BillRecord["reasons"];
  debate_points: BillRecord["debatePoints"];
  affected_groups: BillRecord["affectedGroups"];
  tags: string[];
  thumbnail: BillRecord["thumbnail"];
  furigana: BillFurigana;
  publish_status: PublishStatus;
  is_review_completed: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
};

const EMPTY_FURIGANA: BillFurigana = {
  name: [],
  easy: [],
  detailed: [],
  keyPoints: [],
  reasons: [],
  debatePoints: [],
  affectedGroups: [],
};

// date 型は Date に変換されると時差で日付がずれるので、YYYY-MM-DD の文字列のまま受け取る
function columns() {
  return getSql()`
    id, slug, council, session_name, bill_number, name, status, committee,
    submitted_date::text as submitted_date, decided_date::text as decided_date,
    source_url, minutes_text, summary_easy, summary_detailed,
    key_points, reasons, debate_points, affected_groups, tags, thumbnail, furigana,
    publish_status, is_review_completed, display_order, created_at, updated_at
  `;
}

function fromRow(row: BillRow): BillRecord {
  return {
    id: row.id,
    slug: row.slug,
    council: row.council,
    sessionName: row.session_name,
    billNumber: row.bill_number,
    name: row.name,
    status: row.status,
    committee: row.committee,
    submittedDate: row.submitted_date,
    decidedDate: row.decided_date,
    sourceUrl: row.source_url,
    minutesText: row.minutes_text,
    summaryEasy: row.summary_easy,
    summaryDetailed: row.summary_detailed,
    keyPoints: row.key_points,
    reasons: row.reasons,
    debatePoints: row.debate_points,
    affectedGroups: row.affected_groups,
    tags: row.tags,
    thumbnail: row.thumbnail,
    displayOrder: row.display_order,
    furigana: { ...EMPTY_FURIGANA, ...row.furigana },
    publishStatus: row.publish_status,
    isReviewCompleted: row.is_review_completed,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toRow(input: BillInput, furigana: BillFurigana) {
  const sql = getSql();
  return {
    slug: input.slug,
    council: input.council,
    session_name: input.sessionName,
    bill_number: input.billNumber,
    name: input.name,
    status: input.status,
    committee: input.committee,
    submitted_date: input.submittedDate,
    decided_date: input.decidedDate,
    source_url: input.sourceUrl,
    minutes_text: input.minutesText,
    summary_easy: input.summaryEasy,
    summary_detailed: input.summaryDetailed,
    key_points: sql.json(input.keyPoints),
    reasons: sql.json(input.reasons),
    debate_points: sql.json(input.debatePoints),
    affected_groups: sql.json(input.affectedGroups),
    tags: input.tags,
    thumbnail: input.thumbnail ? sql.json(input.thumbnail) : null,
    display_order: input.displayOrder,
    furigana: sql.json(furigana),
  };
}

// 一意制約違反(slug の重複)をわかりやすいメッセージにする
async function withFriendlyErrors<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if ((e as PostgresError).code === "23505") {
      throw new Error("同じ URL 識別子(slug)の議案がすでにあります。別の slug にしてください");
    }
    throw e;
  }
}

export async function listBills(options: { publishedOnly?: boolean } = {}): Promise<BillRecord[]> {
  const sql = getSql();
  const rows = await sql<BillRow[]>`
    select ${columns()} from bills
    ${options.publishedOnly ? sql`where publish_status = 'published'` : sql``}
    order by council, display_order, created_at
  `;
  return rows.map(fromRow);
}

export async function findBillById(id: string): Promise<BillRecord | null> {
  const sql = getSql();
  // uuid でない文字列で検索すると DB がエラーにするので、先に弾く
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await sql<BillRow[]>`select ${columns()} from bills where id = ${id}`;
  return row ? fromRow(row) : null;
}

// 新規作成は下書き・レビュー未完了から始める
export async function createBill(input: BillInput): Promise<BillRecord> {
  const sql = getSql();
  const furigana = await buildBillFurigana(input);
  return withFriendlyErrors(async () => {
    const [row] = await sql<BillRow[]>`
      insert into bills ${sql({ ...toRow(input, furigana), publish_status: "draft", is_review_completed: false })}
      returning ${columns()}
    `;
    return fromRow(row);
  });
}

export async function updateBill(id: string, input: BillInput): Promise<BillRecord> {
  const sql = getSql();
  const furigana = await buildBillFurigana(input);
  return withFriendlyErrors(async () => {
    const [row] = await sql<BillRow[]>`
      update bills set ${sql(toRow(input, furigana))} where id = ${id}
      returning ${columns()}
    `;
    if (!row) throw new Error("議案が見つかりません");
    return fromRow(row);
  });
}

export async function setPublishStatus(id: string, publishStatus: PublishStatus): Promise<void> {
  await getSql()`update bills set publish_status = ${publishStatus} where id = ${id}`;
}

export async function setReviewCompleted(id: string, completed: boolean): Promise<void> {
  await getSql()`update bills set is_review_completed = ${completed} where id = ${id}`;
}

export async function deleteBill(id: string): Promise<void> {
  await getSql()`delete from bills where id = ${id}`;
}

// 使われていない slug を作る(例: nagoya-1-copy, nagoya-1-copy-2, ...)
async function nextAvailableSlug(base: string): Promise<string> {
  const rows = await getSql()<{ slug: string }[]>`select slug from bills where slug like ${`${base}%`}`;
  const used = new Set(rows.map((r) => r.slug));
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    if (!used.has(`${base}-${n}`)) return `${base}-${n}`;
  }
}

// 複製は下書き・レビュー未完了として作る(名前の末尾に「(複製)」を付ける)
export async function duplicateBill(id: string): Promise<BillRecord> {
  const source = await findBillById(id);
  if (!source) throw new Error("複製元の議案が見つかりません");
  return createBill({
    ...toInput(source),
    slug: await nextAvailableSlug(`${source.slug}-copy`),
    name: `${source.name}(複製)`,
  });
}
