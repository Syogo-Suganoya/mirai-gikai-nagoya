import Link from "next/link";
import { notFound } from "next/navigation";
import { agendasGeneratedAt, getAgendaSessions, withFeaturedSlugs } from "@/data/agendas";
import { councils, type CouncilKey } from "@/data/councils";
import { getPublishedBillsByCouncil } from "@/lib/bills/queries";
import AgendaList from "./agenda-list";

export function generateStaticParams() {
  return councils.map((c) => ({ council: c.key }));
}

export default async function CouncilAgendasPage({
  params,
}: {
  params: Promise<{ council: string }>;
}) {
  const { council: key } = await params;
  const council = councils.find((c) => c.key === key);
  if (!council) notFound();

  const sessions = withFeaturedSlugs(
    getAgendaSessions(council.key as CouncilKey),
    await getPublishedBillsByCouncil(council.key as CouncilKey),
  );
  const total = sessions.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-amber-700"
      >
        ← トップに戻る
      </Link>

      <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">
          {council.shortName}
        </span>
        <h1 className="mt-2 text-2xl font-bold">{council.name}の議案一覧</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          直近1年の定例会・臨時会で審議された議案 {total}件 です。
          「やさしい解説を読む」が付いている議案は、会議録をもとに内容をわかりやすく解説しています。
        </p>
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
          議会での質疑や討論の内容(会議録)は、{council.name}の
          <a
            href={council.minutesSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber-700"
          >
            会議録検索
          </a>
          で議案名を入力すると読めます。データ更新日: {agendasGeneratedAt}
        </p>
      </div>

      <AgendaList sessions={sessions} />
    </div>
  );
}
