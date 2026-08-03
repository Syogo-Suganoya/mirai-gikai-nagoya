"use client";

import type { FuriganaSegment } from "@/data/bills";
import FuriganaText from "@/app/furigana-text";
import { useDetailLevel } from "@/app/detail-level-context";

export default function BillExplanation({
  easyFurigana,
  detailedFurigana,
}: {
  easyFurigana: FuriganaSegment[];
  detailedFurigana: FuriganaSegment[];
}) {
  const { detailed } = useDetailLevel();

  return (
    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
      <FuriganaText segments={detailed ? detailedFurigana : easyFurigana} />
    </p>
  );
}
