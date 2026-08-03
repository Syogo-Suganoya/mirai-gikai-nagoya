"use client";

import type { FuriganaSegment } from "@/data/bills";
import { useFurigana } from "./furigana-context";

export default function FuriganaText({
  segments,
}: {
  segments: FuriganaSegment[];
}) {
  const { show } = useFurigana();
  return (
    <>
      {segments.map((seg, i) =>
        show && seg.reading ? (
          <ruby key={i}>
            {seg.text}
            <rt className="text-[0.55em] font-normal text-zinc-400">
              {seg.reading}
            </rt>
          </ruby>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}
