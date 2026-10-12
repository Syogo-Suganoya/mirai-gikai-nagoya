import "server-only";

import { getSql } from "@/lib/db";
import type { PublishStatus } from "./types";

// アップロードしたサムネイル画像(bill_thumbnails テーブル)の読み書き

export const THUMBNAIL_MAX_BYTES = 1.5 * 1024 * 1024;

const SIGNATURES: { type: string; test: (b: Buffer) => boolean }[] = [
  { type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { type: "image/webp", test: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
];

// ファイルの中身(先頭のバイト)から画像の種類を判定する。対応していなければ null
export function detectImageType(data: Buffer): string | null {
  return SIGNATURES.find((s) => s.test(data))?.type ?? null;
}

export async function saveThumbnail(billId: string, contentType: string, data: Buffer): Promise<void> {
  await getSql()`
    insert into bill_thumbnails (bill_id, content_type, data)
    values (${billId}, ${contentType}, ${data})
    on conflict (bill_id) do update
      set content_type = excluded.content_type, data = excluded.data, updated_at = now()
  `;
}

export async function deleteThumbnail(billId: string): Promise<void> {
  await getSql()`delete from bill_thumbnails where bill_id = ${billId}`;
}

export async function findThumbnail(
  billId: string,
): Promise<{ contentType: string; data: Buffer; publishStatus: PublishStatus } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(billId)) return null;
  const [row] = await getSql()<{ content_type: string; data: Buffer; publish_status: PublishStatus }[]>`
    select t.content_type, t.data, b.publish_status
    from bill_thumbnails t join bills b on b.id = t.bill_id
    where t.bill_id = ${billId}
  `;
  return row ? { contentType: row.content_type, data: row.data, publishStatus: row.publish_status } : null;
}
