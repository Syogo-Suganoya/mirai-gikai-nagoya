import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { bills, billStatusLabels, getBillById } from "@/data/bills";
import { getCouncil } from "@/data/councils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// チャットUIはMarkdownを描画せずそのまま文字列を表示するため、記法を使わせない。
const OUTPUT_FORMAT_RULE = `# 回答の書き方
Markdown記法は使わず、普通の文章で回答してください。
「#」による見出し、「*」「**」による強調や箇条書き、表は使用しないこと。
話題が変わるところで改行を入れ、2〜3文程度の短い段落に分けて読みやすくしてください。`;

function buildBillSystemPrompt(billId: string) {
  const bill = getBillById(billId);
  if (!bill) return null;
  const council = getCouncil(bill.council);

  return `あなたは「${council.name}」の議案についてわかりやすく説明するアシスタントです。
以下の議案情報だけを根拠に、専門用語を避けて、事実に基づいて回答してください。
情報が無い質問には、わからない旨を正直に答えてください。

${OUTPUT_FORMAT_RULE}

# 議会
${council.name}

# 会期
${bill.sessionName}

# 議案番号
${bill.billNumber}

# 議案名
${bill.name}

# かんたん解説
${bill.summaryEasy}

# くわしい解説
${bill.summaryDetailed}

# 会議録からの発言内容
${bill.minutesText}`;
}

function buildGeneralSystemPrompt() {
  const directory = bills
    .map((b) => {
      const council = getCouncil(b.council);
      return `- [${council.name}] ${b.sessionName} ${b.billNumber} ${b.name}(${billStatusLabels[b.status]}): ${b.summaryEasy}`;
    })
    .join("\n");

  return `あなたは「愛知県議会」「名古屋市会」の議案や、地方議会の仕組みについてわかりやすく説明するアシスタントです。
専門用語を避け、以下の議案一覧の情報だけを根拠に事実に基づいて回答してください。
一覧にない具体的な内容を聞かれた場合は、わからない旨を正直に答え、各議案ページの出典リンクを見るよう案内してください。

${OUTPUT_FORMAT_RULE}

# 現在掲載している議案一覧
${directory}`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { billId, messages } = body as {
    billId?: string;
    messages: ChatMessage[];
  };

  const systemPrompt = billId
    ? buildBillSystemPrompt(billId)
    : buildGeneralSystemPrompt();

  if (!systemPrompt) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  const { text } = await generateText({
    model: google("gemini-3.6-flash"),
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  return NextResponse.json({ reply: text });
}
