// 議案一覧(直近1年分)。scripts/ingest-agendas.ts が生成する data/agendas.json を型付きで読み込む。
// agendas.json は手で編集せず、npm run ingest:agendas で再生成すること。

import type { FuriganaSegment } from "./bills";
import type { CouncilKey } from "./councils";
import agendasJson from "./agendas.json";

export type AgendaItem = {
  id: string;
  council: CouncilKey;
  sessionName: string;
  sessionMonth: string; // YYYY-MM
  submitter: string; // 市長提出 / 議員提出 / 知事提出 / 専決処分
  billNumber: string;
  name: string;
  nameFurigana: FuriganaSegment[];
  committee: string;
  submittedDate?: string;
  decidedDate?: string;
  result: string; // 空文字は未議決(審議中)
  sourceUrl: string;
};

export const agendasGeneratedAt: string = agendasJson.generatedAt;
export const agendaItems = agendasJson.items as AgendaItem[];

// 議案(DB)と議案一覧の行を照らし合わせるための項目
type AgendaMatchKey = {
  council: CouncilKey;
  sessionName: string;
  billNumber: string;
  name: string;
};

// 括弧の全角/半角や空白の違いを無視して議案名を比べる
const normalizeName = (s: string) => s.replace(/[()（）\s]/g, "");

export function matchesAgendaItem(bill: AgendaMatchKey, item: AgendaItem): boolean {
  return (
    bill.council === item.council &&
    bill.sessionName === item.sessionName &&
    bill.billNumber === item.billNumber &&
    normalizeName(bill.name) === normalizeName(item.name)
  );
}
