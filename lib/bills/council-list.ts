// 公開サイトの議会別の議案一覧。管理画面で「公開」にした議案だけを、会期ごとにまとめて並べる。
// 提出者(市長提出など)と会期の並び順は、取得済みの議案一覧(data/agendas.json)と照らし合わせて補う

import { agendaItems, matchesAgendaItem } from "@/data/agendas";
import type { FuriganaSegment } from "@/lib/furigana";
import { isTitleOnly } from "./content";
import type { BillRecord, BillStatus } from "./types";

export type CouncilListItem = {
  slug: string;
  submitter: string;
  billNumber: string;
  nameFurigana: FuriganaSegment[];
  status: BillStatus;
  committee: string;
  decidedDate: string | null;
  hasExplanation: boolean;
};

export type CouncilListSession = {
  sessionName: string;
  sessionMonth: string; // YYYY-MM(並べ替え用。わからなければ空)
  sourceUrls: string[];
  items: CouncilListItem[];
};

// 「令和8年2月定例会」→ 2026-02。読めなければ提出日の年月
function monthOf(bill: BillRecord): string {
  const m = bill.sessionName.match(/令和(\d+)年(\d+)月/);
  if (m) return `${2018 + Number(m[1])}-${m[2].padStart(2, "0")}`;
  return bill.submittedDate?.slice(0, 7) ?? "";
}

export function buildCouncilList(bills: BillRecord[]): CouncilListSession[] {
  const rows = bills.map((bill) => {
    const index = agendaItems.findIndex((item) => matchesAgendaItem(bill, item));
    const agenda = index === -1 ? undefined : agendaItems[index];
    return { bill, agenda, order: index === -1 ? Number.MAX_SAFE_INTEGER : index };
  });

  const map = new Map<string, CouncilListSession>();
  // 議案一覧と同じ順(提出者・番号順)に並べる。議案一覧に無い議案は表示順で後ろに
  rows.sort((a, b) => a.order - b.order || a.bill.displayOrder - b.bill.displayOrder);
  for (const { bill, agenda } of rows) {
    const session = map.get(bill.sessionName) ?? {
      sessionName: bill.sessionName,
      sessionMonth: agenda?.sessionMonth ?? monthOf(bill),
      sourceUrls: [],
      items: [],
    };
    session.items.push({
      slug: bill.slug,
      submitter: agenda?.submitter ?? "",
      billNumber: bill.billNumber,
      nameFurigana: bill.furigana.name,
      status: bill.status,
      committee: bill.committee,
      decidedDate: bill.decidedDate,
      hasExplanation: !isTitleOnly(bill),
    });
    if (bill.sourceUrl && !session.sourceUrls.includes(bill.sourceUrl)) session.sourceUrls.push(bill.sourceUrl);
    map.set(bill.sessionName, session);
  }
  return [...map.values()].sort((a, b) => b.sessionMonth.localeCompare(a.sessionMonth));
}
