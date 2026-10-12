"use client";

import Link from "next/link";
import { useState } from "react";
import { councils, type CouncilKey } from "@/data/councils";

export type PickerRow = {
  id: string;
  council: CouncilKey;
  sessionName: string;
  sessionMonth: string;
  submitter: string;
  billNumber: string;
  name: string;
  committee: string;
  result: string;
  existingBillId?: string;
};

export default function AgendaPicker({ rows }: { rows: PickerRow[] }) {
  const [council, setCouncil] = useState<CouncilKey | "">("");
  const [query, setQuery] = useState("");
  const [onlyNew, setOnlyNew] = useState(false);

  const q = query.trim();
  const filtered = rows.filter(
    (r) =>
      (!council || r.council === council) &&
      (!onlyNew || !r.existingBillId) &&
      (!q || r.name.includes(q) || r.committee.includes(q) || r.billNumber.includes(q)),
  );

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={council}
          onChange={(e) => setCouncil(e.target.value as CouncilKey | "")}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">すべての議会</option>
          {councils.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="議案名・委員会・番号でしぼりこむ"
          className="min-w-64 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-1 text-sm text-zinc-600">
          <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
          未登録のみ
        </label>
        <span className="text-xs text-zinc-500">{filtered.length}件</span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-3 py-2">会期・番号</th>
              <th className="px-3 py-2">議案名</th>
              <th className="px-3 py-2">委員会</th>
              <th className="px-3 py-2">結果</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.slice(0, 300).map((r) => (
              <tr key={r.id} className="align-top">
                <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-600">
                  {r.sessionName}
                  <br />
                  {r.submitter} {r.billNumber}
                </td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 text-xs text-zinc-600">{r.committee}</td>
                <td className="whitespace-nowrap px-3 py-2 text-xs">{r.result || "審議中"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-xs">
                  {r.existingBillId ? (
                    <Link href={`/admin/bills/${r.existingBillId}/edit`} className="text-zinc-500 underline">
                      登録済み(編集)
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/bills/new?agenda=${encodeURIComponent(r.id)}`}
                      className="rounded-lg bg-amber-500 px-2.5 py-1 font-semibold text-white hover:bg-amber-600"
                    >
                      この議案で作成
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 300 && (
          <p className="p-3 text-center text-xs text-zinc-500">
            先頭300件を表示しています。しぼりこんでください。
          </p>
        )}
      </div>
    </div>
  );
}
