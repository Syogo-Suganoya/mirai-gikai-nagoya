import type { BillStatus } from "./types";

export const statusPillClass: Record<BillStatus, string> = {
  introduced: "bg-zinc-100 text-zinc-700",
  in_committee: "bg-amber-100 text-amber-800",
  in_plenary: "bg-amber-100 text-amber-800",
  enacted: "bg-emerald-100 text-emerald-800",
  amended: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-700",
  continued: "bg-sky-100 text-sky-800",
};
