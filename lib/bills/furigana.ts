import "server-only";

import { applyFuriganaOverrides, toFurigana, type FuriganaSegment } from "@/lib/furigana";
import type { BillFurigana, BillInput } from "./types";

// 保存する内容から、公開サイトで使うふりがなをまとめて作る(管理画面で入力した読みの修正も反映する)
export async function buildBillFurigana(input: BillInput): Promise<BillFurigana> {
  const f = async (text: string) => applyFuriganaOverrides(await toFurigana(text), input.furiganaOverrides);
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

// 管理画面の「ふりがな」で確認する語の一覧。漢字を含む語と、自動で付けた読み(付かなかった語は空)を
// 文章に出てくる順に並べる。同じ語に複数の読みが付いていれば「・」でつなぐ
export type FuriganaWord = { text: string; autoReading: string; count: number };

export async function listFuriganaWords(input: BillInput): Promise<FuriganaWord[]> {
  const auto = await buildBillFurigana({ ...input, furiganaOverrides: [] });
  const all: FuriganaSegment[] = [
    auto.name,
    auto.easy,
    auto.detailed,
    ...auto.keyPoints.flatMap((p) => [p.title, p.body]),
    ...auto.reasons.flatMap((r) => [r.title, r.body]),
    ...auto.debatePoints.flatMap((d) => [d.topic, d.benefit, d.caution]),
    ...auto.affectedGroups.flatMap((a) => [a.who, a.effect]),
  ].flat();

  const words = new Map<string, { readings: Set<string>; count: number }>();
  const add = (text: string, reading: string) => {
    const w = words.get(text) ?? { readings: new Set<string>(), count: 0 };
    w.readings.add(reading);
    w.count++;
    words.set(text, w);
  };
  for (const seg of all) {
    if (seg.reading) add(seg.text, seg.reading);
    else for (const run of seg.text.match(/[一-鿿々]+/g) ?? []) add(run, "");
  }
  return [...words].map(([text, w]) => ({
    text,
    autoReading: [...w.readings].filter(Boolean).join("・"),
    count: w.count,
  }));
}
