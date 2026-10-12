// 議案(解説付きの注目議案)の型。DB の bills テーブルと公開サイト・管理画面で共通に使う。

import type {
  BillAffectedGroup,
  BillDebatePoint,
  BillKeyPoint,
  BillReason,
  BillThumbnail,
} from "@/data/bills";
import type { CouncilKey } from "@/data/councils";
import type { FuriganaSegment } from "@/lib/furigana";

export type {
  BillAffectedGroup,
  BillDebatePoint,
  BillKeyPoint,
  BillReason,
  BillThumbnail,
};

// 地方議会は一院制で「委員会に付託 → 本会議で議決」と進むため、国会向けの提出院・送付院の代わりにこの7段階を使う
export const BILL_STATUSES = [
  "introduced",
  "in_committee",
  "in_plenary",
  "enacted",
  "amended",
  "rejected",
  "continued",
] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

export const billStatusLabels: Record<BillStatus, string> = {
  introduced: "提出済み",
  in_committee: "委員会で審査中",
  in_plenary: "本会議で審議中",
  enacted: "可決",
  amended: "修正可決",
  rejected: "否決",
  continued: "継続審査",
};

// サムネイルのイラスト(app/components/thumbnails/ の SVG と対応)
export const BILL_ILLUSTRATIONS = [
  "budget",
  "childcare",
  "education",
  "community",
  "organization",
  "industry",
  "labor",
] as const;

export const illustrationLabels: Record<(typeof BILL_ILLUSTRATIONS)[number], string> = {
  budget: "予算・お金(amber)",
  childcare: "子育て(rose)",
  education: "教育(blue)",
  community: "地域・施設(emerald)",
  organization: "組織・制度(violet)",
  industry: "産業(cyan)",
  labor: "働く人(orange)",
};

export const PUBLISH_STATUSES = ["draft", "published"] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export const publishStatusLabels: Record<PublishStatus, string> = {
  draft: "下書き",
  published: "公開中",
};

// 保存時にサーバーで生成するふりがな。各配列は対応するセクションと同じ順番・同じ件数になる
export type BillFurigana = {
  name: FuriganaSegment[];
  easy: FuriganaSegment[];
  detailed: FuriganaSegment[];
  keyPoints: { title: FuriganaSegment[]; body: FuriganaSegment[] }[];
  reasons: { title: FuriganaSegment[]; body: FuriganaSegment[] }[];
  debatePoints: {
    topic: FuriganaSegment[];
    benefit: FuriganaSegment[];
    caution: FuriganaSegment[];
  }[];
  affectedGroups: { who: FuriganaSegment[]; effect: FuriganaSegment[] }[];
};

// ふりがなの手動修正。text(議案の文章中の語)を reading と読む。reading が空ならふりがなを付けない
export type FuriganaOverride = { text: string; reading: string };

// 管理画面で入力する項目(ふりがな・公開状態・タイムスタンプ以外)
export type BillInput = {
  slug: string;
  council: CouncilKey;
  sessionName: string;
  billNumber: string;
  name: string;
  status: BillStatus;
  committee: string;
  submittedDate: string | null; // YYYY-MM-DD
  decidedDate: string | null; // YYYY-MM-DD
  sourceUrl: string | null;
  minutesText: string;
  summaryEasy: string;
  summaryDetailed: string;
  keyPoints: BillKeyPoint[];
  reasons: BillReason[];
  debatePoints: BillDebatePoint[];
  affectedGroups: BillAffectedGroup[];
  tags: string[];
  thumbnail: BillThumbnail | null;
  furiganaOverrides: FuriganaOverride[];
  displayOrder: number;
};

export type BillRecord = BillInput & {
  id: string;
  furigana: BillFurigana;
  publishStatus: PublishStatus;
  isReviewCompleted: boolean;
  // アップロードしたサムネイル画像の更新時刻(ミリ秒)。画像が無ければ null
  thumbnailVersion: string | null;
  createdAt: string;
  updatedAt: string;
};
