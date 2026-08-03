import type { FuriganaSegment } from "@/data/bills";
import FuriganaText from "@/app/furigana-text";

type TitleBody = { title: FuriganaSegment[]; body: FuriganaSegment[] };
type Debate = {
  topic: FuriganaSegment[];
  benefit: FuriganaSegment[];
  caution: FuriganaSegment[];
};
type Affected = { who: FuriganaSegment[]; effect: FuriganaSegment[] };

export default function BillDetailSections({
  keyPoints,
  reasons,
  debatePoints,
  affectedGroups,
}: {
  keyPoints: TitleBody[];
  reasons: TitleBody[];
  debatePoints: Debate[];
  affectedGroups: Affected[];
}) {
  return (
    <>
      <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">🎯 この法律のポイント</h2>
        <ul className="mt-3 space-y-4">
          {keyPoints.map((point, i) => (
            <li key={i}>
              <p className="font-medium text-zinc-900">
                <FuriganaText segments={point.title} />
              </p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                <FuriganaText segments={point.body} />
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">✏️ この法律が必要な理由</h2>
        <ul className="mt-3 space-y-4">
          {reasons.map((reason, i) => (
            <li key={i}>
              <p className="font-medium text-zinc-900">
                <FuriganaText segments={reason.title} />
              </p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                <FuriganaText segments={reason.body} />
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">👀 意見が分かれるところ</h2>
        <ul className="mt-3 space-y-5">
          {debatePoints.map((point, i) => (
            <li key={i}>
              <p className="font-medium text-zinc-900">
                <FuriganaText segments={point.topic} />
              </p>
              <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-800">
                <span className="font-medium">👍 期待される効果</span>
                <br />
                <FuriganaText segments={point.benefit} />
              </p>
              <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm leading-relaxed text-amber-800">
                <span className="font-medium">☝️ 注意が必要なところ</span>
                <br />
                <FuriganaText segments={point.caution} />
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">🙋 影響を受ける人</h2>
        <ul className="mt-3 space-y-2">
          {affectedGroups.map((group, i) => (
            <li key={i} className="text-sm leading-relaxed text-zinc-700">
              <span className="font-medium text-zinc-900">
                <FuriganaText segments={group.who} />
              </span>
              ：<FuriganaText segments={group.effect} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
