import { CSV_COLUMNS } from "@/lib/bills/csv";
import ImportForm from "./import-form";

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-bold">CSVインポート</h1>
      <p className="mt-1 text-sm text-zinc-500">
        CSV から議案をまとめて登録・更新します。新しい slug の行は<strong>下書き</strong>として作成し、
        すでにある slug の行は、値が入っているセルだけを上書きします(空欄のセル・公開状態・レビュー・ポイント等のセクションは変えません)。
        エラーのある行は取り込みません。
      </p>
      <details className="mt-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm">
        <summary className="cursor-pointer font-medium">列の一覧</summary>
        <table className="mt-3 w-full text-left text-xs">
          <thead className="border-b border-zinc-200 text-zinc-500">
            <tr>
              <th className="w-40 py-1.5 pr-4 font-medium">列名</th>
              <th className="py-1.5 font-medium">説明</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-700">
            {CSV_COLUMNS.map((c) => (
              <tr key={c.key}>
                <td className="py-1.5 pr-4 align-top">
                  <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono">{c.key}</code>
                </td>
                <td className="py-1.5 align-top">{c.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-zinc-500">
          1行目に列名を書きます。列の順番は自由で、必須は slug だけです(新規作成の行は議会・会期・番号・議案名も必要)。
          「この法律のポイント」などのセクションは、取り込み後に編集画面で入力してください。
        </p>
      </details>
      <a
        href="/admin/import/template.csv"
        className="mt-3 inline-block text-sm text-amber-700 underline"
      >
        ひな形 CSV をダウンロード
      </a>
      <ImportForm />
    </div>
  );
}
