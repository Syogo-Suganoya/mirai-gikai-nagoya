// 解説文(summaryEasy / summaryDetailed)にふりがなを振るためのセグメント配列を
// kuromoji の形態素解析で自動生成し、data/explanation-furigana.generated.ts に書き出すスクリプト。
// 実行: npm run generate:furigana
// bills.ts の解説文を書き換えたら、このスクリプトを再実行してください(手で generated ファイルを編集しない)。

import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import kuromoji, { type IpadicFeatures } from "kuromoji";
import { bills, type FuriganaSegment } from "../data/bills";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KANJI_RE = /[一-鿿々]/;

// kuromoji(IPADIC)が文脈によって誤読しやすい語の補正辞書。
// 例: 「令和」の「令」が単独トークン化されると「りょう」と誤読されることがあるため固定する。
const FORCED_READINGS: Record<string, string> = {
  令: "れい",
};

function katakanaToHiragana(str: string): string {
  return str.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

// 送り仮名を含むトークン(例: 「育てよう」)を漢字部分と仮名部分に分割し、
// 漢字部分にだけ読みを割り当てる。
// 「(.+?)」を漢字の連続部分、リテラルを非漢字の連続部分としたパターンを作り、
// 読み(ひらがな)全体に対して正規表現マッチさせることで、位置ズレなく対応させる。
function splitTokenFurigana(surface: string, reading: string): FuriganaSegment[] {
  const runRe = /([一-鿿々]+|[^一-鿿々]+)/g;
  const runs: { text: string; isKanji: boolean }[] = [];
  let m: RegExpExecArray | null;
  while ((m = runRe.exec(surface))) {
    runs.push({ text: m[0], isKanji: KANJI_RE.test(m[0][0]) });
  }

  if (runs.every((r) => !r.isKanji) || runs.every((r) => r.isKanji)) {
    return [{ text: surface, reading }];
  }

  let pattern = "^";
  for (const run of runs) {
    pattern += run.isKanji
      ? "(.+?)"
      : run.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  pattern += "$";

  const match = reading.match(new RegExp(pattern));
  if (!match) {
    // 位置合わせに失敗した場合はトークン全体に読みを振る
    return [{ text: surface, reading }];
  }

  const segments: FuriganaSegment[] = [];
  let groupIndex = 1;
  for (const run of runs) {
    if (run.isKanji) {
      const r = match[groupIndex++];
      segments.push(
        r && r !== run.text ? { text: run.text, reading: r } : { text: run.text },
      );
    } else {
      segments.push({ text: run.text });
    }
  }
  return segments;
}

function tokensToSegments(tokens: IpadicFeatures[]): FuriganaSegment[] {
  const raw: FuriganaSegment[] = tokens.flatMap((token) => {
    const surface = token.surface_form;
    if (surface in FORCED_READINGS) {
      return [{ text: surface, reading: FORCED_READINGS[surface] }];
    }
    if (KANJI_RE.test(surface) && token.reading) {
      const reading = katakanaToHiragana(token.reading);
      if (reading !== surface) {
        return splitTokenFurigana(surface, reading);
      }
    }
    return [{ text: surface }];
  });

  // 連続する「ふりがな無し」セグメントは結合して配列を読みやすくする
  const merged: FuriganaSegment[] = [];
  for (const seg of raw) {
    const last = merged[merged.length - 1];
    if (!seg.reading && last && !last.reading) {
      last.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

function buildTokenizer(): Promise<kuromoji.Tokenizer<IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    kuromoji
      .builder({
        dicPath: path.join(__dirname, "../node_modules/kuromoji/dict"),
      })
      .build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
  });
}

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
