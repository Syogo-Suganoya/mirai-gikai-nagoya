"use client";

import Link from "next/link";
import { statusPillClass } from "@/lib/bills/status-style";
import type { BillCardData } from "@/lib/bills/card";
import { billStatusLabels } from "@/lib/bills/types";
import FuriganaText from "@/app/furigana-text";
import BillThumbnailView from "@/app/components/bill-thumbnail";
import { useDetailLevel } from "@/app/detail-level-context";

export default function BillCard({ bill }: { bill: BillCardData }) {
  const { detailed } = useDetailLevel();

  return (
    <li>
      <Link
        href={`/bills/${bill.slug}`}
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
          <FuriganaText segments={bill.furigana.name} />
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-zinc-600">
          <FuriganaText
            segments={
              detailed
                ? bill.furigana.detailed
                : bill.furigana.easy
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
