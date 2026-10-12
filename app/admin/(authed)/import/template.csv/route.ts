import { getCurrentAdmin } from "@/lib/auth/admin";
import { CSV_COLUMNS } from "@/lib/bills/csv";
import { toCsv } from "@/lib/csv";

// CSV インポートのひな形。1行目が列名、2行目が記入例
export async function GET() {
  if (!(await getCurrentAdmin())) return new Response("ログインしてください", { status: 401 });
  const header = CSV_COLUMNS.map((c) => c.key);
  const example = [
    "nagoya-2026-08-138",
    "nagoya_city",
    "令和8年8月定例会",
    "第138号",
    "名古屋市一時保護委託者の登録等に関する基準を定める条例の制定について",
    "可決",
    "教育子ども委員会",
    "2026-08-26",
    "2026-09-08",
    "https://www.city.nagoya.jp/shikai/shingi/1030858/1030859/1052671.html",
    "(かんたん解説)",
    "(くわしい解説)",
    "(会議録の要約)",
    "新設条例, 子育て",
  ];
  // Excel で文字化けしないよう BOM を付ける
  return new Response("﻿" + toCsv([header, example]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bills-template.csv"',
    },
  });
}
