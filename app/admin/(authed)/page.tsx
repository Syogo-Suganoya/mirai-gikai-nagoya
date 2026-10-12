import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { councils, getCouncil } from "@/data/councils";
import { listBills } from "@/lib/bills/repository";
import { statusPillClass } from "@/lib/bills/status-style";
import { billStatusLabels, BILL_STATUSES, type BillRecord } from "@/lib/bills/types";
import BillRowActions from "./bill-row-actions";

const SORTS = {
  updated: "更新日の新しい順",
  status: "審議の状況順",
  publish: "公開状態順(下書きが先)",
  order: "表示順",
} as const;
type SortKey = keyof typeof SORTS;

// 解説(かんたん・くわしい)も4つのセクションも空で、議案名などの基本情報しかない議案
// (「議案一覧から作成」や CSV で取り込んだ直後など)
function isTitleOnly(bill: BillRecord): boolean {
  return (
    !bill.summaryEasy.trim() &&
    !bill.summaryDetailed.trim() &&
    bill.keyPoints.length === 0 &&
    bill.reasons.length === 0 &&
    bill.debatePoints.length === 0 &&
    bill.affectedGroups.length === 0
  );
}

export default async function AdminBillsPage({
  searchParams,
}: {
  searchParams: Promise<{ council?: string; sort?: string; content?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const council = councils.find((c) => c.key === params.council)?.key;
  const sort: SortKey = params.sort && params.sort in SORTS ? (params.sort as SortKey) : "updated";
  const titleOnly = params.content === "title_only";

  const councilBills = (await listBills()).filter((b) => !council || b.council === council);
  const titleOnlyCount = councilBills.filter(isTitleOnly).length;
  const bills = councilBills
    .filter((b) => !titleOnly || isTitleOnly(b))
    .sort((a, b) => {
      switch (sort) {
        case "status":
          return BILL_STATUSES.indexOf(a.status) - BILL_STATUSES.indexOf(b.status);
        case "publish":
          return a.publishStatus.localeCompare(b.publishStatus); // "draft" < "published"
        case "order":
          return a.council.localeCompare(b.council) || a.displayOrder - b.displayOrder;
        default:
          return b.updatedAt.localeCompare(a.updatedAt);
      }
    });

  const query = (next: { council?: string; sort?: string; titleOnly?: boolean }) => {
    const p = new URLSearchParams();
    const c = "council" in next ? next.council : council;
    const s = "sort" in next ? next.sort : sort;
    const t = "titleOnly" in next ? next.titleOnly : titleOnly;
    if (c) p.set("council", c);
    if (s && s !== "updated") p.set("sort", s);
    if (t) p.set("content", "title_only");
    const q = p.toString();
    return q ? `/admin?${q}` : "/admin";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">議案管理</h1>
        <span className="text-sm text-zinc-500">{bills.length}件</span>
        <div className="ml-auto flex gap-2">
          <Link
            href="/admin/agendas"
            className="rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
          >
            議案一覧から作成
          </Link>
          <Link
            href="/admin/bills/new"
            className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            ＋ 新規作成
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={query({ council: undefined })}
          className={`rounded-full px-3 py-1 ${!council ? "bg-zinc-800 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200"}`}
        >
          すべて
        </Link>
        {councils.map((c) => (
          <Link
            key={c.key}
            href={query({ council: c.key })}
            className={`rounded-full px-3 py-1 ${council === c.key ? "bg-zinc-800 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200"}`}
          >
            {c.name}
          </Link>
        ))}
        <Link
          href={query({ titleOnly: !titleOnly })}
          title="解説もセクションも入っていない議案だけを表示します"
          className={`rounded-full px-3 py-1 ${titleOnly ? "bg-orange-500 text-white" : "bg-white text-orange-700 ring-1 ring-orange-200"}`}
        >
          {titleOnly ? "✓ " : ""}件名のみ {titleOnlyCount}件
        </Link>
        <span className="ml-auto text-xs text-zinc-500">並べ替え:</span>
        {(Object.keys(SORTS) as SortKey[]).map((key) => (
          <Link
            key={key}
            href={query({ sort: key })}
            className={`text-xs ${sort === key ? "font-semibold text-amber-700" : "text-zinc-500 hover:text-amber-700"}`}
          >
            {SORTS[key]}
          </Link>
        ))}
      </div>

      {bills.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          {titleOnly
            ? "件名だけの議案はありません。"
            : "議案がありません。「新規作成」か「議案一覧から作成」で追加してください。"}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-3 py-2">議案名</th>
                <th className="px-3 py-2">議会・会期</th>
                <th className="px-3 py-2">審議の状況</th>
                <th className="px-3 py-2">公開</th>
                <th className="px-3 py-2">レビュー</th>
                <th className="px-3 py-2">更新日</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {bills.map((bill) => (
                <tr key={bill.id} className="align-top">
                  <td className="max-w-md px-3 py-3">
                    <Link href={`/admin/bills/${bill.id}/edit`} className="font-medium hover:text-amber-700">
                      {bill.name}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-zinc-400">{bill.slug}</span>
                      {isTitleOnly(bill) && (
                        <span
                          title="解説もセクションも入っていません"
                          className="rounded bg-orange-100 px-1.5 py-0.5 font-medium text-orange-800"
                        >
                          件名のみ
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-600">
                    {getCouncil(bill.council).name}
                    <br />
                    {bill.sessionName} {bill.billNumber}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusPillClass[bill.status]}`}>
                      {billStatusLabels[bill.status]}
                    </span>
                  </td>
                  <BillRowActions
                    id={bill.id}
                    slug={bill.slug}
                    publishStatus={bill.publishStatus}
                    isReviewCompleted={bill.isReviewCompleted}
                    updatedAt={new Date(bill.updatedAt).toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
