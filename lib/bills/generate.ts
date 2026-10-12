import "server-only";

import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getCouncil } from "@/data/councils";
import type { BillFormValues } from "./schema";

// 管理画面の「AIで生成」ボタンで、解説から各セクション(この法律のポイント など)の下書きを作る

const MAX_ROWS = 5;

const titleBody = z.object({ title: z.string(), body: z.string() });

const sections = {
  keyPoints: {
    label: "この法律のポイント",
    instruction: "この議案で何が決まる・変わるのかを、重要なものから3〜5個。見出しは20文字程度、本文は1〜2文。",
    schema: z.array(titleBody),
  },
  reasons: {
    label: "この法律が必要な理由",
    instruction: "なぜこの議案が提出されたのか、背景や目的を2〜4個。見出しは20文字程度、本文は1〜2文。",
    schema: z.array(titleBody),
  },
  debatePoints: {
    label: "意見が分かれるところ",
    instruction:
      "賛否や議論になりそうな論点を2〜3個。論点ごとに、期待される効果(benefit)と注意が必要なところ(caution)を1〜2文ずつ。どちらかに肩入れせず中立に書く。",
    schema: z.array(z.object({ topic: z.string(), benefit: z.string(), caution: z.string() })),
  },
  affectedGroups: {
    label: "影響を受ける人",
    instruction: "この議案で影響を受ける人や団体を2〜4個。who は短い名詞、effect はどんな影響があるかを1〜2文。",
    schema: z.array(z.object({ who: z.string(), effect: z.string() })),
  },
} as const;

export type GeneratableSection = keyof typeof sections;
export const GENERATABLE_SECTIONS = Object.keys(sections) as GeneratableSection[];

export type GenerateSource = Pick<
  BillFormValues,
  "council" | "sessionName" | "billNumber" | "name" | "summaryEasy" | "summaryDetailed" | "minutesText"
>;

export function isAiConfigured() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export async function generateSection<S extends GeneratableSection>(
  section: S,
  source: GenerateSource,
): Promise<BillFormValues[S]> {
  const def = sections[section];
  const council = getCouncil(source.council);
  const { output } = await generateText({
    model: google("gemini-3.6-flash"),
    output: Output.object({ schema: z.object({ items: def.schema }) }),
    system: `あなたは地方議会の議案を、中学生にもわかる言葉で説明する編集者です。
与えられた議案情報だけを根拠に、事実に基づいて書いてください。書かれていないことを推測で付け足さないこと。
Markdown 記法は使わず、です・ます調で書いてください。`,
    prompt: `次の議案について「${def.label}」を作ってください。
${def.instruction}

# 議会
${council.name}

# 会期・議案番号
${source.sessionName} ${source.billNumber}

# 議案名
${source.name}

# かんたん解説
${source.summaryEasy || "(なし)"}

# くわしい解説
${source.summaryDetailed || "(なし)"}

# 会議録の要約
${source.minutesText || "(なし)"}`,
  });
  if (!output) throw new Error("AI から結果を受け取れませんでした。もう一度試してください");
  return output.items.slice(0, MAX_ROWS) as BillFormValues[S];
}
