"use client";

import Link from "next/link";
import { useState } from "react";
import FuriganaText from "@/app/furigana-text";
import type { CouncilListSession } from "@/lib/bills/council-list";
import { statusPillClass } from "@/lib/bills/status-style";
import { billStatusLabels } from "@/lib/bills/types";

const plainText = (segments: { text: string }[]) => segments.map((s) => s.text).join("");

export default function AgendaList({ sessions }: { sessions: CouncilListSession[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim();
  const filtered = sessions
    .map((s) => ({
      ...s,
      items: q
        ? s.items.filter((i) => plainText(i.nameFurigana).includes(q) || i.committee.includes(q))
        : s.items,
    }))
    .filter((s) => s.items.length > 0);
  const hitCount = filtered.reduce((n, s) => n + s.items.length, 0);

  if (sessions.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
        紹介している議案はまだありません。
      </p>
    );
  }

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
              <li key={item.slug} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span>
                    {item.submitter} {item.billNumber}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-medium ${statusPillClass[item.status]}`}>
                    {billStatusLabels[item.status]}
                  </span>
                  {item.decidedDate && <span>議決日: {item.decidedDate}</span>}
                </div>
                <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-900">
                  <Link href={`/bills/${item.slug}`} className="hover:text-amber-700">
                    <FuriganaText segments={item.nameFurigana} />
                  </Link>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  {item.committee && <span>付議・付託委員会: {item.committee}</span>}
                  {item.hasExplanation && (
                    <Link
                      href={`/bills/${item.slug}`}
                      className="rounded-full bg-amber-500 px-2 py-0.5 font-semibold text-white hover:bg-amber-600"
                    >
                      やさしい解説を読む →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {session.sourceUrls.length > 0 && (
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
          )}
        </section>
      ))}
    </div>
  );
}
