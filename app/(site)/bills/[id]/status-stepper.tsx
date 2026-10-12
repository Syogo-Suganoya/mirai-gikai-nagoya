import { billStatusLabels, type BillStatus } from "@/lib/bills/types";

// 地方議会の流れ: 提出(上程) → 委員会で審査 → 本会議で審議 → 議決
const steps = ["提出", "委員会審査", "本会議", "議決"];

const stepIndex: Record<BillStatus, number> = {
  introduced: 0,
  in_committee: 1,
  continued: 1, // 委員会で継続審査になっている
  in_plenary: 2,
  enacted: 3,
  amended: 3,
  rejected: 3,
};

export default function StatusStepper({ status }: { status: BillStatus }) {
  const currentIndex = stepIndex[status];
  const isRejected = status === "rejected";
  const isDecided = currentIndex === steps.length - 1;

  return (
    <div>
      <div className="flex items-center">
        {steps.map((label, i) => {
          const isDone = i <= currentIndex;
          const isCurrent = i === currentIndex;
          const doneColor =
            isCurrent && isDecided
              ? isRejected
                ? "bg-rose-500 text-white"
                : "bg-emerald-500 text-white"
              : isCurrent
                ? "bg-amber-500 text-white"
                : "bg-emerald-500 text-white";
          return (
            <div key={label} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    isDone ? doneColor : "bg-zinc-200 text-zinc-500"
                  }`}
                >
                  {i + 1}
                </div>
                <span className="whitespace-nowrap text-xs text-zinc-600">
                  {i === steps.length - 1 && isDecided ? billStatusLabels[status] : label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 ${i < currentIndex ? "bg-emerald-500" : "bg-zinc-200"}`}
                />
              )}
            </div>
          );
        })}
      </div>
      {status === "continued" && (
        <p className="mt-3 text-xs text-sky-800">
          委員会で結論が出ず、次の会期以降に引き続き審査されます(継続審査)。
        </p>
      )}
    </div>
  );
}
