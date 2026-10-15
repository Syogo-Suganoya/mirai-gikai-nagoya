import "server-only";

import { unstable_cache } from "next/cache";
import type { CouncilKey } from "@/data/councils";
import { isDbConfigured } from "@/lib/db";
import { listBills, listDraftBillKeys } from "./repository";
import { staticBillRecords } from "./static";
import type { BillRecord } from "./types";

// 公開サイトが読む議案のキャッシュタグ。管理画面で保存したら updateTag(BILLS_CACHE_TAG) で消す
export const BILLS_CACHE_TAG = "bills";

// 公開中の議案だけを返す。DB 未設定なら静的データを使う
const getPublishedBillsFromDb = unstable_cache(
  () => listBills({ publishedOnly: true }),
  ["published-bills"],
  { tags: [BILLS_CACHE_TAG], revalidate: 600 },
);

export async function getPublishedBills(): Promise<BillRecord[]> {
  if (!isDbConfigured()) return staticBillRecords;
  return getPublishedBillsFromDb();
}

// 下書きの議案(公開サイトの議案一覧から隠す)。DB 未設定なら下書きは無い
const getDraftBillKeysFromDb = unstable_cache(listDraftBillKeys, ["draft-bill-keys"], {
  tags: [BILLS_CACHE_TAG],
  revalidate: 600,
});

export async function getDraftBillKeysByCouncil(council: CouncilKey) {
  if (!isDbConfigured()) return [];
  return (await getDraftBillKeysFromDb()).filter((b) => b.council === council);
}

export async function getPublishedBillsByCouncil(council: CouncilKey): Promise<BillRecord[]> {
  return (await getPublishedBills()).filter((b) => b.council === council);
}

export async function getPublishedBillBySlug(slug: string): Promise<BillRecord | null> {
  return (await getPublishedBills()).find((b) => b.slug === slug) ?? null;
}
