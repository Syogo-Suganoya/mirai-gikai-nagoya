// 管理画面の議案フォームの入力値と、そのチェック・変換。
// クライアント(react-hook-form)とサーバー(Server Action)で同じスキーマを使う。

import { z } from "zod";
import { BILL_ILLUSTRATIONS, BILL_STATUSES, type BillInput, type BillRecord } from "./types";

// YYYY-MM-DD で、実在する日付か(2026-13-40 などを弾く)
function isValidDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

const text = (label: string, max: number) =>
  z.string().trim().min(1, `${label}を入力してください`).max(max, `${label}は${max}文字以内にしてください`);
const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label}は${max}文字以内にしてください`);

export const billFormSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1, "URL 識別子(slug)を入力してください")
      .max(80, "slug は80文字以内にしてください")
      .regex(/^[a-z0-9-]+$/, "slug は半角英小文字・数字・ハイフンだけで入力してください"),
    council: z.enum(["aichi_pref", "nagoya_city"], { message: "議会を選んでください" }),
    sessionName: text("会期", 50),
    billNumber: text("議案番号", 30),
    name: text("議案名", 300),
    status: z.enum(BILL_STATUSES),
    committee: optionalText("付託委員会", 200),
    submittedDate: z.string().refine((v) => v === "" || isValidDate(v), "提出日は YYYY-MM-DD の正しい日付にしてください"),
    decidedDate: z.string().refine((v) => v === "" || isValidDate(v), "議決日は YYYY-MM-DD の正しい日付にしてください"),
    sourceUrl: z
      .string()
      .trim()
      .refine((v) => v === "" || /^https?:\/\//.test(v), "http:// か https:// で始まる URL を入力してください"),
    minutesText: optionalText("会議録の要約", 20000),
    summaryEasy: optionalText("かんたん解説", 2000),
    summaryDetailed: optionalText("くわしい解説", 5000),
    keyPoints: z.array(z.object({ title: text("見出し", 200), body: text("本文", 1000) })).max(10),
    reasons: z.array(z.object({ title: text("見出し", 200), body: text("本文", 1000) })).max(10),
    debatePoints: z
      .array(
        z.object({
          topic: text("論点", 200),
          benefit: text("期待される効果", 1000),
          caution: text("注意が必要なところ", 1000),
        }),
      )
      .max(10),
    affectedGroups: z
      .array(z.object({ who: text("影響を受ける人", 100), effect: text("影響の内容", 500) }))
      .max(10),
    tagsText: optionalText("タグ", 300),
    thumbnailType: z.enum(["none", "illustration", "photo"]),
    illustration: z.enum(BILL_ILLUSTRATIONS),
    photoKeyword: z.string().trim(),
    photoFallback: z.enum(BILL_ILLUSTRATIONS),
    furiganaOverrides: z
      .array(
        z.object({
          text: z.string().trim().min(1, "語を入力してください").max(30, "語は30文字以内にしてください"),
          reading: z
            .string()
            .trim()
            .max(60, "読みは60文字以内にしてください")
            .regex(/^[ぁ-ゖー]*$/, "読みはひらがなで入力してください(空欄ならふりがなを付けません)"),
        }),
      )
      .max(500),
    displayOrder: z.number().int().min(0).max(9999),
  })
  .refine((v) => !v.submittedDate || !v.decidedDate || v.decidedDate >= v.submittedDate, {
    message: "議決日は提出日以降にしてください",
    path: ["decidedDate"],
  })
  .refine((v) => v.thumbnailType !== "photo" || /^[a-z0-9]+(,[a-z0-9]+)*$/.test(v.photoKeyword), {
    message: "写真のキーワードは半角英小文字の単語をカンマ区切りで入力してください(例: baby,nursery,japan)",
    path: ["photoKeyword"],
  });

export type BillFormValues = z.infer<typeof billFormSchema>;

// タグは「,」「、」区切り。前後の空白と重複を取り除く
export function parseTags(tagsText: string): string[] {
  return [...new Set(tagsText.split(/[,、]/).map((t) => t.trim()).filter(Boolean))];
}

export function formValuesToInput(v: BillFormValues): BillInput {
  return {
    slug: v.slug,
    council: v.council,
    sessionName: v.sessionName,
    billNumber: v.billNumber,
    name: v.name,
    status: v.status,
    committee: v.committee,
    submittedDate: v.submittedDate || null,
    decidedDate: v.decidedDate || null,
    sourceUrl: v.sourceUrl || null,
    minutesText: v.minutesText,
    summaryEasy: v.summaryEasy,
    summaryDetailed: v.summaryDetailed,
    keyPoints: v.keyPoints,
    reasons: v.reasons,
    debatePoints: v.debatePoints,
    affectedGroups: v.affectedGroups,
    tags: parseTags(v.tagsText),
    thumbnail:
      v.thumbnailType === "illustration"
        ? { type: "illustration", illustration: v.illustration }
        : v.thumbnailType === "photo"
          ? { type: "photo", keyword: v.photoKeyword, fallback: v.photoFallback }
          : null,
    // 同じ語が複数あるときは後のものを使う
    furiganaOverrides: [...new Map(v.furiganaOverrides.map((o) => [o.text, o])).values()],
    displayOrder: v.displayOrder,
  };
}

export const emptyBillFormValues: BillFormValues = {
  slug: "",
  council: "nagoya_city",
  sessionName: "",
  billNumber: "",
  name: "",
  status: "introduced",
  committee: "",
  submittedDate: "",
  decidedDate: "",
  sourceUrl: "",
  minutesText: "",
  summaryEasy: "",
  summaryDetailed: "",
  keyPoints: [],
  reasons: [],
  debatePoints: [],
  affectedGroups: [],
  tagsText: "",
  thumbnailType: "none",
  illustration: "budget",
  photoKeyword: "",
  photoFallback: "budget",
  furiganaOverrides: [],
  displayOrder: 0,
};

export function billToFormValues(bill: BillInput | BillRecord): BillFormValues {
  const t = bill.thumbnail;
  return {
    slug: bill.slug,
    council: bill.council,
    sessionName: bill.sessionName,
    billNumber: bill.billNumber,
    name: bill.name,
    status: bill.status,
    committee: bill.committee,
    submittedDate: bill.submittedDate ?? "",
    decidedDate: bill.decidedDate ?? "",
    sourceUrl: bill.sourceUrl ?? "",
    minutesText: bill.minutesText,
    summaryEasy: bill.summaryEasy,
    summaryDetailed: bill.summaryDetailed,
    keyPoints: bill.keyPoints,
    reasons: bill.reasons,
    debatePoints: bill.debatePoints,
    affectedGroups: bill.affectedGroups,
    tagsText: bill.tags.join(", "),
    thumbnailType: t ? t.type : "none",
    illustration: t?.type === "illustration" ? t.illustration : "budget",
    photoKeyword: t?.type === "photo" ? t.keyword : "",
    photoFallback: t?.type === "photo" ? t.fallback : "budget",
    furiganaOverrides: bill.furiganaOverrides,
    displayOrder: bill.displayOrder,
  };
}
