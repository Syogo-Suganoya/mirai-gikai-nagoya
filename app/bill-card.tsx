"use client";

import Link from "next/link";
import { bills, billStatusLabels, type BillStatus } from "@/data/bills";
import { explanationFurigana } from "@/data/explanation-furigana.generated";
import FuriganaText from "@/app/furigana-text";
import BillThumbnailView from "@/app/components/bill-thumbnail";
import { useDetailLevel } from "@/app/detail-level-context";

const statusPillClass: Record<BillStatus, string> = {
  introduced: "bg-zinc-100 text-zinc-700",
  in_deliberation: "bg-amber-100 text-amber-800",
  enacted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-700",
};

export default function BillCard({ billId }: { billId: string }) {
  const bill = bills.find((b) => b.id === billId);
  const { detailed } = useDetailLevel();
  if (!bill) return null;

  return (
    <li>
      <Link
        href={`/bills/${bill.id}`}
        className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-amber-400 hover:shadow"
      >
        {bill.thumbnail && (
          <div className="mb-3">
            <BillThumbnailView thumbnail={bill.thumbnail} />
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-500">
            {bill.sessionName} {bill.billNumber}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClass[bill.status]}`}
          >
            {billStatusLabels[bill.status]}
          </span>
        </div>
        <h3 className="mt-1.5 font-semibold leading-snug">
          <FuriganaText segments={bill.nameFurigana} />
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-zinc-600">
          <FuriganaText
            segments={
              detailed
                ? explanationFurigana[bill.id].detailed
                : explanationFurigana[bill.id].easy
            }
          />
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {bill.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-500"
            >
              #{tag}
            </span>
          ))}
        </div>
      </Link>
    </li>
  );
}
