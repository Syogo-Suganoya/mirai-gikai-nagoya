// 解説文(summaryEasy / summaryDetailed)にふりがなを振るためのセグメント配列を
// kuromoji の形態素解析で自動生成し、data/explanation-furigana.generated.ts に書き出すスクリプト。
// 実行: npm run generate:furigana
// bills.ts の解説文を書き換えたら、このスクリプトを再実行してください(手で generated ファイルを編集しない)。

import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { bills } from "../data/bills";
import { buildTokenizer, tokensToSegments } from "../lib/furigana";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const tokenizer = await buildTokenizer();
  const seg = (text: string) => tokensToSegments(tokenizer.tokenize(text));

  const entries = bills.map((bill) => {
    const easy = seg(bill.summaryEasy);
    const detailed = seg(bill.summaryDetailed);
    const keyPoints = bill.keyPoints.map((p) => ({
      title: seg(p.title),
      body: seg(p.body),
    }));
    const reasons = bill.reasons.map((r) => ({
      title: seg(r.title),
      body: seg(r.body),
    }));
    const debatePoints = bill.debatePoints.map((d) => ({
      topic: seg(d.topic),
      benefit: seg(d.benefit),
      caution: seg(d.caution),
    }));
    const affectedGroups = bill.affectedGroups.map((a) => ({
      who: seg(a.who),
      effect: seg(a.effect),
    }));
    return `  "${bill.id}": {
    easy: ${JSON.stringify(easy)},
    detailed: ${JSON.stringify(detailed)},
    keyPoints: ${JSON.stringify(keyPoints)},
    reasons: ${JSON.stringify(reasons)},
    debatePoints: ${JSON.stringify(debatePoints)},
    affectedGroups: ${JSON.stringify(affectedGroups)},
  },`;
  });

  const output = `// 自動生成ファイル。手で編集しないでください。
// 生成スクリプト: scripts/generate-explanation-furigana.ts (npm run generate:furigana)
import type { FuriganaSegment } from "./bills";

type TitleBody = { title: FuriganaSegment[]; body: FuriganaSegment[] };
type Debate = {
  topic: FuriganaSegment[];
  benefit: FuriganaSegment[];
  caution: FuriganaSegment[];
};
type Affected = { who: FuriganaSegment[]; effect: FuriganaSegment[] };

export const explanationFurigana: Record<
  string,
  {
    easy: FuriganaSegment[];
    detailed: FuriganaSegment[];
    keyPoints: TitleBody[];
    reasons: TitleBody[];
    debatePoints: Debate[];
    affectedGroups: Affected[];
  }
> = {
${entries.join("\n")}
};
`;

  const outPath = path.join(
    __dirname,
    "../data/explanation-furigana.generated.ts",
  );
  fs.writeFileSync(outPath, output, "utf-8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
