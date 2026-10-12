import "server-only";

import { toFurigana } from "@/lib/furigana";
import type { BillFurigana, BillInput } from "./types";

// 保存する内容から、公開サイトで使うふりがなをまとめて作る
export async function buildBillFurigana(input: BillInput): Promise<BillFurigana> {
  const f = toFurigana;
  return {
    name: await f(input.name),
    easy: await f(input.summaryEasy),
    detailed: await f(input.summaryDetailed),
    keyPoints: await Promise.all(
      input.keyPoints.map(async (p) => ({ title: await f(p.title), body: await f(p.body) })),
    ),
    reasons: await Promise.all(
      input.reasons.map(async (r) => ({ title: await f(r.title), body: await f(r.body) })),
    ),
    debatePoints: await Promise.all(
      input.debatePoints.map(async (d) => ({
        topic: await f(d.topic),
        benefit: await f(d.benefit),
        caution: await f(d.caution),
      })),
    ),
    affectedGroups: await Promise.all(
      input.affectedGroups.map(async (a) => ({ who: await f(a.who), effect: await f(a.effect) })),
    ),
  };
}
