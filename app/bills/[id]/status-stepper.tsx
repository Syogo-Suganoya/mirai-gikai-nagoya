import type { BillStatus } from "@/data/bills";

const steps: { key: BillStatus; label: string }[] = [
  { key: "introduced", label: "提出" },
  { key: "in_deliberation", label: "審議" },
  { key: "enacted", label: "成立" },
];

export default function StatusStepper({ status }: { status: BillStatus }) {
  const isRejected = status === "rejected";
  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const isDone = !isRejected && i <= currentIndex;
        const isCurrent = !isRejected && i === currentIndex;
        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  isDone
                    ? isCurrent
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-500 text-white"
                    : "bg-zinc-200 text-zinc-500"
                }`}
              >
                {i + 1}
              </div>
              <span className="text-xs text-zinc-600">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 ${
                  !isRejected && i < currentIndex ? "bg-emerald-500" : "bg-zinc-200"
                }`}
              />
            )}
          </div>
        );
      })}
      {isRejected && (
        <span className="ml-3 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
          否決
        </span>
      )}
    </div>
  );
}
