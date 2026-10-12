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

// 一覧の1行。解説ページがある議案には、その slug を付けて渡す
export type AgendaRow = AgendaItem & { featuredSlug?: string };

export type AgendaSession = {
  sessionName: string;
  sessionMonth: string;
  sourceUrls: string[];
  items: AgendaRow[];
};

export const agendasGeneratedAt: string = agendasJson.generatedAt;
export const agendaItems = agendasJson.items as AgendaItem[];

export function getAgendaItemsByCouncil(council: CouncilKey): AgendaItem[] {
  return agendaItems.filter((i) => i.council === council);
}

// 定例会・臨時会ごとにまとめ、新しい会期から並べる
export function getAgendaSessions(council: CouncilKey): AgendaSession[] {
  const map = new Map<string, AgendaSession>();
  for (const item of getAgendaItemsByCouncil(council)) {
    const session = map.get(item.sessionName) ?? {
      sessionName: item.sessionName,
      sessionMonth: item.sessionMonth,
      sourceUrls: [],
      items: [],
    };
    session.items.push(item);
    if (!session.sourceUrls.includes(item.sourceUrl)) session.sourceUrls.push(item.sourceUrl);
    map.set(item.sessionName, session);
  }
  return [...map.values()].sort((a, b) => b.sessionMonth.localeCompare(a.sessionMonth));
}

type FeaturedBillKey = {
  slug: string;
  council: CouncilKey;
  sessionName: string;
  billNumber: string;
  name: string;
};

// 括弧の全角/半角や空白の違いを無視して議案名を比べる
const normalizeName = (s: string) => s.replace(/[()（）\s]/g, "");

export function matchesAgendaItem(bill: Omit<FeaturedBillKey, "slug">, item: AgendaItem): boolean {
  return (
    bill.council === item.council &&
    bill.sessionName === item.sessionName &&
    bill.billNumber === item.billNumber &&
    normalizeName(bill.name) === normalizeName(item.name)
  );
}

// 解説ページがある議案(公開中の注目議案)に featuredSlug を付ける
export function withFeaturedSlugs(
  sessions: AgendaSession[],
  bills: FeaturedBillKey[],
): AgendaSession[] {
  return sessions.map((session) => ({
    ...session,
    items: session.items.map((item) => {
      const bill = bills.find((b) => matchesAgendaItem(b, item));
      return bill ? { ...item, featuredSlug: bill.slug } : item;
    }),
  }));
}
