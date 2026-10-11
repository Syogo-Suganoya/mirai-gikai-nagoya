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
  featuredBillId?: string; // 解説を書いている注目議案(data/bills.ts)の id
};

export type AgendaSession = {
  sessionName: string;
  sessionMonth: string;
  sourceUrls: string[];
  items: AgendaItem[];
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
