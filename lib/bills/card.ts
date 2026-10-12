import type { BillRecord } from "./types";

// クライアントに渡すのはカード表示に必要な項目だけ(会議録の要約などは送らない)
export type BillCardData = Pick<
  BillRecord,
  "slug" | "thumbnail" | "sessionName" | "billNumber" | "status" | "tags"
> & {
  furigana: Pick<BillRecord["furigana"], "name" | "easy" | "detailed">;
  uploadedThumbnailUrl: string | null;
};

// アップロードしたサムネイル画像の URL(無ければ null で、bill.thumbnail のデフォルト表示になる)
export function uploadedThumbnailUrl(bill: Pick<BillRecord, "id" | "thumbnailVersion">): string | null {
  return bill.thumbnailVersion ? `/bill-thumbnails/${bill.id}?v=${bill.thumbnailVersion}` : null;
}

export function toBillCardData(bill: BillRecord): BillCardData {
  return {
    slug: bill.slug,
    thumbnail: bill.thumbnail,
    sessionName: bill.sessionName,
    billNumber: bill.billNumber,
    status: bill.status,
    tags: bill.tags,
    furigana: { name: bill.furigana.name, easy: bill.furigana.easy, detailed: bill.furigana.detailed },
    uploadedThumbnailUrl: uploadedThumbnailUrl(bill),
  };
}
