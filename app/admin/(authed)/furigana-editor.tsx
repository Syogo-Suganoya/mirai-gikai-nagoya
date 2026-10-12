"use client";

import { useState, type KeyboardEvent } from "react";
import { useFieldArray, type Control, type FieldErrors } from "react-hook-form";
import type { FuriganaWord } from "@/lib/bills/furigana";
import type { BillFormValues } from "@/lib/bills/schema";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm focus:border-amber-500 focus:outline-none";

// 編集画面の「ふりがな」。自動で付けた読みを語ごとに確認し、違うものは読みを書きかえる。
// 修正は furiganaOverrides(語 → 読み)として議案に保存し、保存のたびに自動の読みへ上書きする。
// そのため、解説を書きかえても、同じ語には修正した読みが付き続ける。
export default function FuriganaEditor({
  control,
  errors,
  words,
}: {
  control: Control<BillFormValues>;
  errors: FieldErrors<BillFormValues>;
  words: FuriganaWord[] | null; // null は新規作成(まだ保存していない)
}) {
  const { fields, append, remove, update } = useFieldArray({ control, name: "furiganaOverrides" });
  const [query, setQuery] = useState("");
  const [onlyEdited, setOnlyEdited] = useState(false);
  const [newText, setNewText] = useState("");
  const [newReading, setNewReading] = useState("");

  const indexOf = (text: string) => fields.findIndex((f) => f.text === text);

  // 語の一覧(本文から自動で拾った語)と、手で追加した語(本文の語の区切りと違うもの)
  const known = new Set((words ?? []).map((w) => w.text));
  const rows = [
    ...fields.filter((f) => !known.has(f.text)).map((f) => ({ text: f.text, autoReading: null, count: null })),
    ...(words ?? []),
  ].filter((w) => (!query || w.text.includes(query)) && (!onlyEdited || indexOf(w.text) !== -1));

  const setReading = (text: string, autoReading: string | null, reading: string) => {
    const i = indexOf(text);
    if (autoReading !== null && reading === autoReading) {
      if (i !== -1) remove(i); // 自動の読みと同じなら修正は不要
    } else if (i === -1) {
      append({ text, reading });
    } else {
      update(i, { text, reading });
    }
  };

  const addWord = () => {
    const text = newText.trim();
    if (!text) return;
    const i = indexOf(text);
    if (i === -1) append({ text, reading: newReading.trim() });
    else update(i, { text, reading: newReading.trim() });
    setNewText("");
    setNewReading("");
  };

  // 追加欄で Enter を押したときに、フォーム全体が送信(保存)されないようにして追加する
  const addOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      addWord();
    }
  };

  const overrideErrors = errors.furiganaOverrides;
  const firstError = Array.isArray(overrideErrors)
    ? overrideErrors.flatMap((e, i) => (e ? [`「${fields[i]?.text}」: ${e.reading?.message ?? e.text?.message}`] : []))[0]
    : undefined;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="font-semibold">ふりがな</h2>
      <p className="mt-1 text-xs text-zinc-500">
        保存したときに自動で付けた読みを、語ごとに確認・修正できます。読みはひらがなで入力し、
        空欄にするとその語にはふりがなを付けません。修正は「保存」で反映され、解説を書きかえても同じ語に付き続けます。
      </p>

      {words === null ? (
        <p className="mt-4 text-xs text-zinc-400">保存すると、ここで語ごとの読みを確認できます。</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="語で絞り込み"
              className={`${inputClass} max-w-48`}
            />
            <label className="flex items-center gap-1 text-xs text-zinc-600">
              <input type="checkbox" checked={onlyEdited} onChange={(e) => setOnlyEdited(e.target.checked)} />
              修正したものだけ
            </label>
            <span className="ml-auto text-xs text-zinc-500">
              {words.length}語・修正 {fields.length}件
            </span>
          </div>

          <div className="mt-3 max-h-96 overflow-y-auto rounded-lg border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-zinc-50 text-xs text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">語</th>
                  <th className="px-3 py-2 font-medium">自動の読み</th>
                  <th className="px-3 py-2 font-medium">読み</th>
                  <th className="w-20 px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((w) => {
                  const i = indexOf(w.text);
                  const edited = i !== -1;
                  const value = edited ? fields[i].reading : (w.autoReading ?? "");
                  return (
                    <tr key={w.text} className={edited ? "bg-amber-50" : undefined}>
                      <td className="px-3 py-1.5">
                        {w.text}
                        {w.count !== null && w.count > 1 && (
                          <span className="ml-1 text-xs text-zinc-400">×{w.count}</span>
                        )}
                        {w.autoReading === null && <span className="ml-1 text-xs text-amber-700">追加した語</span>}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-zinc-500">
                        {w.autoReading === null ? "—" : w.autoReading || "(なし)"}
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          value={value}
                          onChange={(e) => setReading(w.text, w.autoReading, e.target.value)}
                          className={inputClass}
                          aria-label={`${w.text}の読み`}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {edited && (
                          <button type="button" onClick={() => remove(i)} className="text-xs text-zinc-500 hover:underline">
                            {w.autoReading === null ? "削除" : "元に戻す"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-xs text-zinc-400">
                      該当する語はありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-4 rounded-lg bg-zinc-50 p-3">
        <p className="text-xs text-zinc-600">
          語の区切りが違うとき(例: 「名古屋」「市会」に分かれた語を「名古屋市会」として読ませたい)は、語と読みを追加します。
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="語(例: 名古屋市会)"
            onKeyDown={addOnEnter}
            className={`${inputClass} max-w-48`}
          />
          <input
            value={newReading}
            onChange={(e) => setNewReading(e.target.value)}
            placeholder="読み(例: なごやしかい)"
            onKeyDown={addOnEnter}
            className={`${inputClass} max-w-48`}
          />
          <button
            type="button"
            onClick={addWord}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
          >
            追加
          </button>
        </div>
      </div>
      {firstError && <p className="mt-2 text-xs text-rose-600">{firstError}</p>}
    </section>
  );
}
