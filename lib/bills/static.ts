// DB を設定していない環境(DATABASE_URL が未設定のとき)で使う静的データ。
// data/bills.ts と自動生成のふりがな(data/explanation-furigana.generated.ts)を BillRecord の形にそろえる。
// DB の初期データ(db/seed.sql)もここから作る(npm run db:seed:generate)。

import { bills as staticBills, type Bill } from "@/data/bills";
import { explanationFurigana } from "@/data/explanation-furigana.generated";
import type { BillRecord, BillStatus } from "./types";

// 旧データの4段階ステータスを7段階に読み替える(修正可決は会議録の記述から判定する)
function toStatus(bill: Bill): BillStatus {
  switch (bill.status) {
    case "introduced":
      return "introduced";
    case "in_deliberation":
      return "in_committee";
    case "rejected":
      return "rejected";
    case "enacted":
      return bill.minutesText.includes("修正可決") ? "amended" : "enacted";
  }
}

// 付託委員会(名古屋は議案一覧、愛知は会議録の審査結果で確認したもの)
const committees: Record<string, string> = {
  "nagoya-1": "総務環境委員会 財政福祉委員会 教育子ども委員会 土木交通委員会 経済水道委員会 都市消防委員会",
  "nagoya-2": "財政福祉委員会",
  "nagoya-3": "教育子ども委員会",
  "nagoya-4": "教育子ども委員会",
  "nagoya-5": "教育子ども委員会",
  "aichi-1": "経済労働",
  "aichi-2": "経済労働",
  "aichi-3": "総務企画、県民環境、福祉医療、経済労働、建設、教育・スポーツ、警察",
  "aichi-4": "県民環境",
  "aichi-5": "総務企画、県民環境、福祉医療、経済労働、農林水産、教育・スポーツ",
};

export const staticBillRecords: BillRecord[] = staticBills.map((bill, i) => {
  const f = explanationFurigana[bill.id];
  return {
    id: bill.id,
    slug: bill.id,
    council: bill.council,
    sessionName: bill.sessionName,
    billNumber: bill.billNumber,
    name: bill.name,
    status: toStatus(bill),
    committee: committees[bill.id] ?? "",
    submittedDate: bill.submittedDate,
    decidedDate: bill.decidedDate ?? null,
    sourceUrl: bill.sourceUrl,
    minutesText: bill.minutesText,
    summaryEasy: bill.summaryEasy,
    summaryDetailed: bill.summaryDetailed,
    keyPoints: bill.keyPoints,
    reasons: bill.reasons,
    debatePoints: bill.debatePoints,
    affectedGroups: bill.affectedGroups,
    tags: bill.tags,
    thumbnail: bill.thumbnail ?? null,
    furiganaOverrides: [],
    displayOrder: i,
    furigana: {
      name: bill.nameFurigana,
      easy: f.easy,
      detailed: f.detailed,
      keyPoints: f.keyPoints,
      reasons: f.reasons,
      debatePoints: f.debatePoints,
      affectedGroups: f.affectedGroups,
    },
    publishStatus: "published",
    isReviewCompleted: true,
    thumbnailVersion: null,
    createdAt: "2026-07-20T00:00:00+09:00",
    updatedAt: "2026-07-20T00:00:00+09:00",
  };
});
