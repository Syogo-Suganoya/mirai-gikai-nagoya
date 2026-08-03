import Link from "next/link";
import { notFound } from "next/navigation";
import { bills, billStatusLabels, type BillStatus, getBillById } from "@/data/bills";
import { getCouncil } from "@/data/councils";
import { explanationFurigana } from "@/data/explanation-furigana.generated";
import ChatWidget from "@/app/components/chat-widget";
import FuriganaText from "@/app/furigana-text";
import BillThumbnailView from "@/app/components/bill-thumbnail";
import BillExplanation from "./bill-explanation";
import StatusStepper from "./status-stepper";
import BillDetailSections from "./bill-detail-sections";

const statusPillClass: Record<BillStatus, string> = {
  introduced: "bg-zinc-100 text-zinc-700",
  in_deliberation: "bg-amber-100 text-amber-800",
  enacted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-700",
};

export function generateStaticParams() {
  return bills.map((bill) => ({ id: bill.id }));
}

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bill = getBillById(id);
  if (!bill) {
    notFound();
  }

  const council = getCouncil(bill.council);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-amber-700"
      >
        ← トップに戻る
      </Link>

      {/* ヒーローカード */}
      <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        {bill.thumbnail && (
          <div className="mb-4">
            <BillThumbnailView thumbnail={bill.thumbnail} />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">
            {council.shortName}
          </span>
          <span className="text-xs text-zinc-500">
            {bill.sessionName} {bill.billNumber}
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-bold leading-snug">
          <FuriganaText segments={bill.nameFurigana} />
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClass[bill.status]}`}
          >
            {billStatusLabels[bill.status]}
          </span>
          <span className="text-zinc-500">提出日: {bill.submittedDate}</span>
          {bill.decidedDate && (
            <span className="text-zinc-500">議決日: {bill.decidedDate}</span>
          )}
        </div>

        <BillExplanation
          easyFurigana={explanationFurigana[bill.id].easy}
          detailedFurigana={explanationFurigana[bill.id].detailed}
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {bill.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-500"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* 審議のステータス */}
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">👉 審議のステータス</h2>
        <StatusStepper status={bill.status} />
      </section>

      <BillDetailSections
        keyPoints={explanationFurigana[bill.id].keyPoints}
        reasons={explanationFurigana[bill.id].reasons}
        debatePoints={explanationFurigana[bill.id].debatePoints}
        affectedGroups={explanationFurigana[bill.id].affectedGroups}
      />

      <section className="mt-8">
        <h2 className="font-semibold">💬 この議案について質問する</h2>
        <ChatWidget billId={bill.id} />
      </section>

      <p className="mt-6 text-xs text-zinc-400">
        出典:{" "}
        <a
          href={bill.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-amber-700"
        >
          {council.name} 公式サイトの議案一覧
        </a>
      </p>
    </div>
  );
}
