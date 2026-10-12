import { agendaItems, agendasGeneratedAt, matchesAgendaItem } from "@/data/agendas";
import { requireAdminPage } from "@/lib/auth/admin";
import { listBills } from "@/lib/bills/repository";
import AgendaPicker, { type PickerRow } from "./agenda-picker";

export default async function AdminAgendasPage() {
  await requireAdminPage();
  const bills = await listBills();
  const rows: PickerRow[] = agendaItems.map((item) => ({
    id: item.id,
    council: item.council,
    sessionName: item.sessionName,
    sessionMonth: item.sessionMonth,
    submitter: item.submitter,
    billNumber: item.billNumber,
    name: item.name,
    committee: item.committee,
    result: item.result,
    existingBillId: bills.find((b) => matchesAgendaItem(b, item))?.id,
  }));
  rows.sort((a, b) => b.sessionMonth.localeCompare(a.sessionMonth));

  return (
    <div>
      <h1 className="text-xl font-bold">議案一覧から作成</h1>
      <p className="mt-1 text-sm text-zinc-500">
        取得済みの議案一覧(直近1年・{rows.length}件、データ更新日 {agendasGeneratedAt})から選ぶと、
        議案名・番号・委員会・議決結果を入力した状態で新規作成を始められます。
      </p>
      <AgendaPicker rows={rows} />
    </div>
  );
}
