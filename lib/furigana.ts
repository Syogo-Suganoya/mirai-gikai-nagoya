// kuromoji の形態素解析で、文章をふりがな表示用のセグメント配列に変換する共通処理。
// 管理画面の保存処理(サーバー)と、scripts/ 配下のスクリプトの両方から使う。

import path from "node:path";
import kuromoji, { type IpadicFeatures } from "kuromoji";

// ふりがな表示用に文章を分割したもの。text を順番に連結すると元の文章と一致する。
// reading が無いセグメント(ひらがな・カタカナ・数字・記号など)はふりがなを付けない。
export type FuriganaSegment = {
  text: string;
  reading?: string;
};

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

  return mergePlain(raw);
}

// 連続する「ふりがな無し」セグメントは結合して配列を読みやすくする
function mergePlain(segments: FuriganaSegment[]): FuriganaSegment[] {
  const merged: FuriganaSegment[] = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (!seg.reading && last && !last.reading) {
      last.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

// 管理画面で入力した読みの修正を、自動で付けたふりがなに上書きする。
// 文章中の text と一致する箇所を1つのセグメントにまとめて reading を振る(reading が空ならふりがな無し)。
// 長い語から先に当てはめるので、「名古屋市会」と「市会」の両方があれば「名古屋市会」が優先される。
// 自動のセグメントの途中で区切られた部分は、読みがずれるのでふりがな無しにする。
export function applyFuriganaOverrides(
  segments: FuriganaSegment[],
  overrides: { text: string; reading: string }[],
): FuriganaSegment[] {
  const text = segments.map((s) => s.text).join("");
  const spans: { start: number; end: number; reading: string }[] = [];
  for (const o of [...overrides].sort((a, b) => b.text.length - a.text.length)) {
    if (!o.text) continue;
    for (let i = text.indexOf(o.text); i !== -1; i = text.indexOf(o.text, i + o.text.length)) {
      const end = i + o.text.length;
      if (spans.every((sp) => end <= sp.start || i >= sp.end)) spans.push({ start: i, end, reading: o.reading });
    }
  }
  if (spans.length === 0) return segments;
  spans.sort((a, b) => a.start - b.start);

  // 各文字がどのセグメントに属するか
  const bounds = segments.map((seg, k) => {
    const start = segments.slice(0, k).reduce((n, s) => n + s.text.length, 0);
    return { start, end: start + seg.text.length };
  });
  const result: FuriganaSegment[] = [];
  let k = 0;
  let next = 0;
  for (let i = 0; i < text.length; ) {
    const span = spans[next];
    if (span && span.start === i) {
      result.push(span.reading ? { text: text.slice(span.start, span.end), reading: span.reading } : { text: text.slice(span.start, span.end) });
      i = span.end;
      next++;
      continue;
    }
    while (bounds[k].end <= i) k++;
    const end = Math.min(bounds[k].end, span ? span.start : text.length);
    const whole = i === bounds[k].start && end === bounds[k].end;
    result.push(whole ? { ...segments[k] } : { text: text.slice(i, end) });
    i = end;
  }
  return mergePlain(result);
}

export function buildTokenizer(): Promise<kuromoji.Tokenizer<IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    kuromoji
      .builder({
        // npm スクリプトも Next.js のサーバーもプロジェクト直下で動くため cwd 基準で辞書を探す
        // (Vercel では next.config.ts の outputFileTracingIncludes で辞書を関数に含める)
        dicPath: path.join(process.cwd(), "node_modules/kuromoji/dict"),
      })
      .build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
  });
}

// Next.js のサーバー側で使う tokenizer(プロセス内で1回だけ読み込む)。
// 開発モードの React は、サーバーでの描画中に await した値をデバッグ情報としてブラウザへ送る。
// その際に tokenizer が持つ辞書の ArrayBuffer がストリームへ移されて空になり、以後の解析が
// 「ConnectionCosts buffer overflow」で失敗する。そのため tokenizer そのものを値に持つ Promise を
// await せず、読み込み完了だけを知らせる Promise<void> を待ってから変数の tokenizer を使う。
let tokenizer: kuromoji.Tokenizer<IpadicFeatures> | null = null;
let tokenizerReady: Promise<void> | null = null;

function loadTokenizer(): Promise<void> {
  return new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath: path.join(process.cwd(), "node_modules/kuromoji/dict") })
      .build((err, built) => {
        if (err) return reject(err);
        tokenizer = built;
        resolve();
      });
  });
}

export async function toFurigana(text: string): Promise<FuriganaSegment[]> {
  tokenizerReady ??= loadTokenizer().catch((e) => {
    tokenizerReady = null; // 失敗したら次の呼び出しで読み込み直す
    throw e;
  });
  await tokenizerReady;
  return tokensToSegments(tokenizer!.tokenize(text));
}
