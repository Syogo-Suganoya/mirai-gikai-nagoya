// kuromoji の形態素解析で、文章をふりがな表示用のセグメント配列に変換する共通処理。
// generate-explanation-furigana.ts(解説文)と ingest-agendas.ts(議案一覧)から使う。

import path from "node:path";
import { fileURLToPath } from "node:url";
import kuromoji, { type IpadicFeatures } from "kuromoji";
import type { FuriganaSegment } from "../../data/bills";

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

export function tokensToSegments(tokens: IpadicFeatures[]): FuriganaSegment[] {
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

export function buildTokenizer(): Promise<kuromoji.Tokenizer<IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    kuromoji
      .builder({
        dicPath: path.join(__dirname, "../../node_modules/kuromoji/dict"),
      })
      .build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
  });
}
