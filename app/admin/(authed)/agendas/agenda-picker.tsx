"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { councils, type CouncilKey } from "@/data/councils";
import { registerAgendaItemsAction } from "../../actions";

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
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const q = query.trim();
  const filtered = rows.filter(
    (r) =>
      (!council || r.council === council) &&
      (!onlyNew || !r.existingBillId) &&
      (!q || r.name.includes(q) || r.committee.includes(q) || r.billNumber.includes(q)),
  );

  // 選べるのは未登録の行だけ。「すべて選択」は表示中の300件ではなく、絞り込んだ結果すべてが対象
  const selectable = filtered.filter((r) => !r.existingBillId);
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of selectable) {
        if (allSelected) next.delete(r.id);
        else next.add(r.id);
      }
      return next;
    });

  const register = () => {
    const ids = rows.filter((r) => selected.has(r.id) && !r.existingBillId).map((r) => r.id);
    if (!confirm(`選んだ${ids.length}件を、件名のみの下書きとして登録します。よろしいですか?`)) return;
    startTransition(async () => {
      setMessage(null);
      const result = await registerAgendaItemsAction(ids);
      if (!result.ok) return setMessage({ ok: false, text: result.error });
      const { created, skipped } = result.data;
      setMessage({
        ok: true,
        text: `${created}件を下書きとして登録しました${skipped ? `(登録済み・slug の重複で${skipped}件を飛ばしました)` : ""}。議案管理の「件名のみ」で確認できます。`,
      });
      setSelected(new Set());
      router.refresh();
    });
  };

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

      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-zinc-200">
        <span className="text-zinc-600">{selected.size}件を選択中</span>
        <button
          type="button"
          disabled={pending || selected.size === 0}
          onClick={register}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-40"
        >
          {pending ? "登録中…" : "選んだ議案を件名のみで登録(下書き)"}
        </button>
        {selected.size > 0 && (
          <button type="button" onClick={() => setSelected(new Set())} className="text-xs text-zinc-500 hover:underline">
            選択を解除
          </button>
        )}
        {message && (
          <span className={`text-xs ${message.ok ? "text-emerald-700" : "text-rose-600"}`}>{message.text}</span>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="w-8 px-3 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={selectable.length === 0}
                  onChange={toggleAll}
                  title={`絞り込んだ未登録の議案(${selectable.length}件)をすべて選択`}
                  aria-label="絞り込んだ未登録の議案をすべて選択"
                />
              </th>
              <th className="px-3 py-2">会期・番号</th>
              <th className="px-3 py-2">議案名</th>
              <th className="px-3 py-2">委員会</th>
              <th className="px-3 py-2">結果</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.slice(0, 300).map((r) => (
              <tr key={r.id} className={`align-top ${selected.has(r.id) ? "bg-amber-50" : ""}`}>
                <td className="px-3 py-2">
                  {!r.existingBillId && (
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      aria-label={`${r.name}を選択`}
                    />
                  )}
                </td>
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
