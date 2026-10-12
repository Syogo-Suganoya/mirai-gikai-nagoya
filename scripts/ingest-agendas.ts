// 愛知県議会・名古屋市会の議案一覧(直近1年分)を集めて data/agendas.json に書き出すスクリプト。
// 実行: npm run ingest:agendas
//
// - 名古屋市会: 市公式サイトの「議案の審議経過・結果」(市長提出案件・議員提出議案)を取得して解析する。
// - 愛知県議会: 県公式サイトはスクリプトからのアクセスにボット判定を返すため自動取得しない。
//   ブラウザで開いた議案表を data/raw/aichi/*.tsv にスナップショットとして保存し、それを読み込む。
//   (新しい定例会が開かれたら、同じ形式のTSVを手で追加する)
// - 会議録は両議会の検索システムとも robots.txt で自動取得が禁止されているため取得しない。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AgendaItem } from "../data/agendas";
import type { CouncilKey } from "../data/councils";
import { buildTokenizer, tokensToSegments } from "../lib/furigana";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// 取得対象の期間(この月数以内に開かれた定例会・臨時会)
const MONTHS_BACK = 12;
const REQUEST_INTERVAL_MS = 1500;
const USER_AGENT =
  "mirai-gikai-nagoya-ingest (+https://github.com/Syogo-Suganoya/mirai-gikai-nagoya)";

const NAGOYA_BASE = "https://www.city.nagoya.jp";
const NAGOYA_INDEXES = [
  { submitter: "市長提出", url: `${NAGOYA_BASE}/shikai/shingi/1030858/1030859/index.html` },
  { submitter: "議員提出", url: `${NAGOYA_BASE}/shikai/shingi/1030858/1030911/index.html` },
] as const;


type RawItem = Omit<AgendaItem, "id" | "nameFurigana">;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function clean(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[​﻿]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 「令和8年8月定例会」→ { year: 2026, month: 8 }
function parseSessionMonth(sessionName: string): { year: number; month: number } | null {
  const m = sessionName.match(/(令和|平成)(元|\d+)年(\d+)月/);
  if (!m) return null;
  const n = m[2] === "元" ? 1 : Number(m[2]);
  const year = (m[1] === "令和" ? 2018 : 1988) + n;
  return { year, month: Number(m[3]) };
}

// 表で「該当なし」を表すダッシュ類(‐ ― - － —)は空文字にそろえる
function emptyIfDash(s?: string): string {
  return !s || /^[‐―\-－—]$/.test(s) ? "" : s;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isWithinRange(sessionName: string, now: Date): boolean {
  const s = parseSessionMonth(sessionName);
  if (!s) return false;
  const cutoff = new Date(now.getFullYear(), now.getMonth() - MONTHS_BACK, 1);
  return new Date(s.year, s.month - 1, 1) >= cutoff;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function ingestNagoya(now: Date): Promise<RawItem[]> {
  const items: RawItem[] = [];
  for (const index of NAGOYA_INDEXES) {
    const html = await fetchText(index.url);
    await sleep(REQUEST_INTERVAL_MS);

    const sessions = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
      .map(([, href, text]) => ({ href, title: clean(text) }))
      .filter((l) => l.title.endsWith(`${index.submitter}案件`) || l.title.endsWith(`${index.submitter}議案`))
      .map((l) => ({
        url: new URL(l.href, index.url).toString(),
        sessionName: l.title.replace(/\s*(市長提出案件|議員提出議案).*$/, ""),
      }))
      .filter((s) => isWithinRange(s.sessionName, now));

    for (const session of sessions) {
      const page = await fetchText(session.url);
      await sleep(REQUEST_INTERVAL_MS);
      const { year, month } = parseSessionMonth(session.sessionName)!;

      for (const table of page.match(/<table[\s\S]*?<\/table>/g) ?? []) {
        const rows = (table.match(/<tr[\s\S]*?<\/tr>/g) ?? []).map((r) =>
          [...r.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => clean(c[1])),
        );
        if (rows[0]?.[0] !== "議案番号") continue;
        for (const [billNumber, name, submitted, committee, decided, result] of rows.slice(1)) {
          if (!billNumber || !name) continue;
          const md = (s?: string) => {
            const m = s?.match(/(\d+)月(\d+)日/);
            return m ? toIsoDate(year, Number(m[1]), Number(m[2])) : undefined;
          };
          items.push({
            council: "nagoya_city",
            sessionName: session.sessionName,
            sessionMonth: `${year}-${String(month).padStart(2, "0")}`,
            submitter: index.submitter,
            billNumber,
            name,
            committee: emptyIfDash(committee),
            submittedDate: md(submitted),
            decidedDate: md(decided),
            result: emptyIfDash(result),
            sourceUrl: session.url,
          });
        }
      }
      console.log(`名古屋市会 ${session.sessionName} ${index.submitter}: 取得`);
    }
  }
  return items;
}

function ingestAichiSnapshots(): RawItem[] {
  const dir = path.join(ROOT, "data/raw/aichi");
  const items: RawItem[] = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".tsv")).sort()) {
    const lines = fs.readFileSync(path.join(dir, file), "utf-8").split("\n").filter(Boolean);
    const meta = Object.fromEntries(
      lines.filter((l) => l.startsWith("# ")).map((l) => l.slice(2).split("\t")),
    );
    const { year, month } = parseSessionMonth(meta.session)!;
    for (const line of lines.filter((l) => !l.startsWith("#"))) {
      const [billNumber, name, committee, resultCell] = line.split("\t");
      const m = resultCell.match(/^(\d+)\/(\d+)\s*(.*)$/);
      // 2月定例議会の議決は3月、12月定例議会の議決は12月など、同じ年の中で完結する
      const decidedDate = m ? toIsoDate(year, Number(m[1]), Number(m[2])) : undefined;
      items.push({
        council: "aichi_pref",
        sessionName: meta.session,
        sessionMonth: `${year}-${String(month).padStart(2, "0")}`,
        submitter: billNumber.startsWith("専決") ? "専決処分" : "知事提出",
        billNumber,
        name,
        committee: committee.replace(/、\s+/g, "、"),
        decidedDate,
        result: m ? m[3] : resultCell,
        sourceUrl: meta.url,
      });
    }
    console.log(`愛知県議会 ${meta.session}: スナップショットから読み込み`);
  }
  return items;
}

async function main() {
  const now = new Date();
  const raw = [...ingestAichiSnapshots(), ...(await ingestNagoya(now))];

  const tokenizer = await buildTokenizer();
  const items: AgendaItem[] = raw.map((item) => {
    // 例: nagoya_city-2026-08-市長提出-第138号(データを更新しても同じ議案は同じIDになる)
    return {
      id: `${item.council}-${item.sessionMonth}-${item.submitter}-${item.billNumber}`,
      ...item,
      nameFurigana: tokensToSegments(tokenizer.tokenize(item.name)),
    };
  });

  const out = {
    generatedAt: now.toISOString().slice(0, 10),
    items,
  };
  const outPath = path.join(ROOT, "data/agendas.json");
  // 差分を見やすくするため1件1行で書き出す
  const json = `{"generatedAt":${JSON.stringify(out.generatedAt)},"items":[\n${items
    .map((i) => JSON.stringify(i))
    .join(",\n")}\n]}\n`;
  fs.writeFileSync(outPath, json, "utf-8");

  const count = (c: CouncilKey) => items.filter((i) => i.council === c).length;
  console.log(
    `Wrote ${outPath}: 愛知県議会 ${count("aichi_pref")}件 / 名古屋市会 ${count("nagoya_city")}件`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
