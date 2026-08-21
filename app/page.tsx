import { bills } from "@/data/bills";
import { councils, type CouncilKey } from "@/data/councils";
import ChatWidget from "@/app/components/chat-widget";
import BillCard from "@/app/bill-card";

function CouncilSection({ councilKey }: { councilKey: CouncilKey }) {
  const council = councils.find((c) => c.key === councilKey)!;
  const councilBills = bills.filter((b) => b.council === councilKey);

  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
          {council.shortName}
        </span>
        {council.name}
      </h2>
      {councilBills.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-zinc-300 bg-white/50 p-4 text-sm text-zinc-500">
          まだ議案が登録されていません。
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {councilBills.map((bill) => (
            <BillCard key={bill.id} billId={bill.id} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-amber-100 via-amber-50 to-transparent px-4 py-14 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold leading-snug sm:text-3xl">
            いま愛知県議会・名古屋市会で
            <br />
            議論されていること
          </h1>
          <p className="mt-2 text-lg font-semibold text-amber-700">
            やさしい言葉で説明します
          </p>
          <p className="mt-1 text-xs text-zinc-500">powered by AI (Gemini)</p>
          <p className="mt-3 text-xs text-zinc-500">
            議案は手作業で掲載しており、自動更新はしていません。
            <br />
            最新の審議状況は各議会の公式サイトをご確認ください。
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pb-12">
        <section>
          <h2 className="font-semibold">💬 議会について質問する</h2>
          <ChatWidget
            emptyText="愛知県議会・名古屋市会や、掲載されている議案について気になることを質問できます。"
            suggestions={[
              "愛知県議会って何をするところ？",
              "名古屋市会って何をするところ？",
              "注目の議案を教えて",
            ]}
          />
        </section>

        <CouncilSection councilKey="aichi_pref" />
        <CouncilSection councilKey="nagoya_city" />
      </div>
    </div>
  );
}
