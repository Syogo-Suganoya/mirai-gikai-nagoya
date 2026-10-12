import Link from "next/link";
import { agendaItems } from "@/data/agendas";
import { getCouncil } from "@/data/councils";
import { agendaToFormValues } from "@/lib/bills/from-agenda";
import { emptyBillFormValues } from "@/lib/bills/schema";
import BillForm from "../../bill-form";

export default async function NewBillPage({
  searchParams,
}: {
  searchParams: Promise<{ agenda?: string }>;
}) {
  const { agenda } = await searchParams;
  const item = agenda ? agendaItems.find((i) => i.id === agenda) : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin" className="text-sm text-zinc-500 hover:text-amber-700">
        ← 議案管理に戻る
      </Link>
      <h1 className="mt-2 text-xl font-bold">議案の新規作成</h1>
      {item ? (
        <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          {getCouncil(item.council).name}の議案一覧「{item.sessionName} {item.billNumber}」の内容を入力済みです。
          解説やポイントを書き足して保存してください。
        </p>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">
          作成した議案は「下書き」になります。内容を確認してから、議案管理の一覧で公開してください。
        </p>
      )}
      <div className="mt-5">
        <BillForm mode="create" defaultValues={item ? agendaToFormValues(item) : emptyBillFormValues} />
      </div>
    </div>
  );
}
