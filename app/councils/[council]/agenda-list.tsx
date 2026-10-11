"use client";

import Link from "next/link";
import { useState } from "react";
import type { AgendaSession } from "@/data/agendas";
import FuriganaText from "@/app/furigana-text";

function resultPillClass(result: string): string {
  if (!result) return "bg-zinc-100 text-zinc-600";
  if (result.includes("否決")) return "bg-rose-100 text-rose-700";
  if (result.includes("修正")) return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}

export default function AgendaList({ sessions }: { sessions: AgendaSession[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim();
  const filtered = sessions
    .map((s) => ({
      ...s,
      items: q ? s.items.filter((i) => i.name.includes(q) || i.committee.includes(q)) : s.items,
    }))
    .filter((s) => s.items.length > 0);
  const hitCount = filtered.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="mt-6">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="議案名・委員会名でしぼりこむ(例: 予算、条例、教育)"
        className="w-full rounded-full border border-amber-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-500"
      />
      {q && <p className="mt-2 text-xs text-zinc-500">{hitCount}件が見つかりました</p>}

      {filtered.map((session) => (
        <section key={session.sessionName} className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold">{session.sessionName}</h2>
            <span className="text-xs text-zinc-500">{session.items.length}件</span>
          </div>
          <ul className="mt-3 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {session.items.map((item) => (
              <li key={item.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span>
                    {item.submitter} {item.billNumber}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${resultPillClass(item.result)}`}
                  >
                    {item.result || "審議中"}
                  </span>
                  {item.decidedDate && <span>議決日: {item.decidedDate}</span>}
                </div>
                <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-900">
                  {item.featuredBillId ? (
                    <Link href={`/bills/${item.featuredBillId}`} className="hover:text-amber-700">
                      <FuriganaText segments={item.nameFurigana} />
                    </Link>
                  ) : (
                    <FuriganaText segments={item.nameFurigana} />
                  )}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  {item.committee && <span>付議・付託委員会: {item.committee}</span>}
                  {item.featuredBillId && (
                    <Link
                      href={`/bills/${item.featuredBillId}`}
                      className="rounded-full bg-amber-500 px-2 py-0.5 font-semibold text-white hover:bg-amber-600"
                    >
                      やさしい解説を読む →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-zinc-400">
            出典:{" "}
            {session.sourceUrls.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-700"
              >
                公式サイトの議案一覧{session.sourceUrls.length > 1 ? `(${i + 1})` : ""}
                {i < session.sourceUrls.length - 1 ? " " : ""}
              </a>
            ))}
          </p>
        </section>
      ))}
    </div>
  );
}
