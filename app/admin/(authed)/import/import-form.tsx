"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { importCsvAction, previewCsvAction, type CsvPreview } from "../../actions";

export default function ImportForm() {
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setCsvText(await file.text());
    setPreview(null);
    setMessage(null);
  };

  const check = () =>
    startTransition(async () => {
      setMessage(null);
      const result = await previewCsvAction(csvText);
      if (!result.ok) return setMessage({ ok: false, text: result.error });
      setPreview(result.data);
    });

  const runImport = () =>
    startTransition(async () => {
      const result = await importCsvAction(csvText);
      if (!result.ok) return setMessage({ ok: false, text: result.error });
      const { created, updated, skipped } = result.data;
      setMessage({
        ok: true,
        text: `取り込みました: 新規 ${created}件・更新 ${updated}件${skipped ? `(エラーのため ${skipped}件はスキップ)` : ""}`,
      });
      setPreview(null);
    });

  const okRows = preview?.rows.filter((r) => r.ok) ?? [];
  const ngRows = preview?.rows.filter((r) => !r.ok) ?? [];

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="text-sm" />
        <textarea
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            setPreview(null);
          }}
          rows={8}
          placeholder="ファイルを選ぶか、CSV をここに貼り付けてください"
          className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs"
        />
        <button
          type="button"
          onClick={check}
          disabled={pending || !csvText.trim()}
          className="mt-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending && !preview ? "確認中…" : "内容を確認"}
        </button>
      </div>

      {message && (
        <p className={`rounded-lg p-3 text-sm ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
          {message.text}
          {message.ok && (
            <Link href="/admin" className="ml-2 underline">
              議案管理で確認する
            </Link>
          )}
        </p>
      )}

      {preview && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          {preview.headerErrors.length > 0 ? (
            <p className="text-sm text-rose-700">{preview.headerErrors.join(" / ")}</p>
          ) : (
            <>
              <p className="text-sm">
                取り込める行: <strong>{okRows.length}件</strong>(新規 {okRows.filter((r) => r.ok && r.action === "create").length}・更新{" "}
                {okRows.filter((r) => r.ok && r.action === "update").length})/ エラー: <strong className="text-rose-700">{ngRows.length}件</strong>
              </p>
              <table className="mt-3 w-full text-xs">
                <thead className="text-left text-zinc-500">
                  <tr>
                    <th className="py-1 pr-2">行</th>
                    <th className="py-1 pr-2">slug</th>
                    <th className="py-1 pr-2">結果</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {preview.rows.map((r) => (
                    <tr key={r.line} className="align-top">
                      <td className="py-1 pr-2 text-zinc-500">{r.line}</td>
                      <td className="py-1 pr-2 font-mono">{r.ok ? r.input.slug : r.slug}</td>
                      <td className="py-1 pr-2">
                        {r.ok ? (
                          <span className="text-emerald-700">
                            {r.action === "create" ? "新規作成(下書き)" : "更新"}: {r.input.name}
                          </span>
                        ) : (
                          <span className="text-rose-700">{r.errors.join(" / ")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                onClick={runImport}
                disabled={pending || okRows.length === 0}
                className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40"
              >
                {pending ? "取り込み中…(ふりがなを生成しています)" : `${okRows.length}件を取り込む`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
