"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import * as admins from "@/lib/admins/repository";
import { endSession, requireAdmin, startSession, verifyPassword } from "@/lib/auth/admin";
import { readHeader, rowToInput, type CsvRowResult } from "@/lib/bills/csv";
import { toInput } from "@/lib/bills/input";
import { BILLS_CACHE_TAG } from "@/lib/bills/queries";
import * as repo from "@/lib/bills/repository";
import { billFormSchema, formValuesToInput, type BillFormValues } from "@/lib/bills/schema";
import type { PublishStatus } from "@/lib/bills/types";
import { parseCsv } from "@/lib/csv";
import { isDbConfigured } from "@/lib/db";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

function failure(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : "保存に失敗しました" };
}

// 公開サイトのキャッシュを消して、次のアクセスで DB の内容を読み直させる
function refreshPublicSite() {
  updateTag(BILLS_CACHE_TAG);
}

// ---- ログイン・ログアウト ----

// 失敗したときは入力したメールアドレスも返す(フォームが送信後にリセットされるため、入力欄に戻す)
export async function signIn(
  _prev: { error: string; email?: string } | null,
  formData: FormData,
): Promise<{ error: string; email?: string } | null> {
  if (!isDbConfigured()) {
    return { error: "DB が設定されていません(_memo/DEPLOY.md の手順で DATABASE_URL を設定してください)" };
  }
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const admin = await verifyPassword(email, password);
  if (!admin) {
    // 総当たりを遅らせるため、失敗したときは少し待ってから返す
    await new Promise((r) => setTimeout(r, 1000));
    return { error: "メールアドレスまたはパスワードが違います", email };
  }
  await startSession(admin.id);
  redirect("/admin");
}

export async function signOut() {
  await endSession();
  redirect("/admin/login");
}

// ---- 議案の作成・更新 ----

export async function createBillAction(values: BillFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const bill = await repo.createBill(formValuesToInput(billFormSchema.parse(values)));
    refreshPublicSite();
    return { ok: true, data: { id: bill.id } };
  } catch (e) {
    return failure(e);
  }
}

export async function updateBillAction(id: string, values: BillFormValues): Promise<ActionResult> {
  try {
    await requireAdmin();
    await repo.updateBill(id, formValuesToInput(billFormSchema.parse(values)));
    refreshPublicSite();
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e);
  }
}

export async function setPublishStatusAction(id: string, status: PublishStatus): Promise<ActionResult> {
  try {
    await requireAdmin();
    await repo.setPublishStatus(id, status);
    refreshPublicSite();
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e);
  }
}

export async function setReviewCompletedAction(id: string, completed: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await repo.setReviewCompleted(id, completed);
    refreshPublicSite();
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e);
  }
}

export async function duplicateBillAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const bill = await repo.duplicateBill(id);
    return { ok: true, data: { id: bill.id } };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteBillAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await repo.deleteBill(id);
    refreshPublicSite();
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e);
  }
}

// ---- CSV インポート ----

export type CsvPreview = { rows: CsvRowResult[]; headerErrors: string[] };

async function analyzeCsv(csvText: string): Promise<CsvPreview> {
  const table = parseCsv(csvText);
  if (table.length === 0) return { rows: [], headerErrors: ["CSV が空です"] };
  const { columns, errors } = readHeader(table[0]);
  if (errors.length > 0) return { rows: [], headerErrors: errors };

  const existing = new Map((await repo.listBills()).map((b) => [b.slug, b]));
  const seen = new Set<string>();
  const rows = table.slice(1).map((row, i): CsvRowResult => {
    const slug = (row[columns.indexOf("slug")] ?? "").trim();
    const current = existing.get(slug);
    const result = rowToInput(i + 2, row, columns, current ? toInput(current) : undefined);
    if (result.ok && seen.has(slug)) {
      return { line: i + 2, ok: false, slug, errors: ["同じ slug の行がファイル内に複数あります"] };
    }
    seen.add(slug);
    return result;
  });
  return { rows, headerErrors: [] };
}

export async function previewCsvAction(csvText: string): Promise<ActionResult<CsvPreview>> {
  try {
    await requireAdmin();
    return { ok: true, data: await analyzeCsv(csvText) };
  } catch (e) {
    return failure(e);
  }
}

// エラーのない行だけを取り込む。新しい slug は下書きとして作成し、既存の slug は CSV にある列だけ更新する
export async function importCsvAction(
  csvText: string,
): Promise<ActionResult<{ created: number; updated: number; skipped: number }>> {
  try {
    await requireAdmin();
    const { rows, headerErrors } = await analyzeCsv(csvText);
    if (headerErrors.length > 0) return { ok: false, error: headerErrors.join(" / ") };

    const bySlug = new Map((await repo.listBills()).map((b) => [b.slug, b]));
    let created = 0;
    let updated = 0;
    for (const row of rows) {
      if (!row.ok) continue;
      const current = bySlug.get(row.input.slug);
      if (current) {
        await repo.updateBill(current.id, row.input);
        updated++;
      } else {
        await repo.createBill(row.input);
        created++;
      }
    }
    refreshPublicSite();
    return { ok: true, data: { created, updated, skipped: rows.filter((r) => !r.ok).length } };
  } catch (e) {
    return failure(e);
  }
}

// ---- 管理者 ----

export async function createAdminAction(email: string, password: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await admins.createAdmin(email, password);
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e);
  }
}

// パスワードを変えると、その管理者はログインし直しになる(自分のパスワードを変えた場合も同じ)
export async function changeAdminPasswordAction(adminId: string, password: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await admins.changePassword(adminId, password);
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteAdminAction(adminId: string): Promise<ActionResult> {
  try {
    const me = await requireAdmin();
    if (me.id === adminId) return { ok: false, error: "自分自身は削除できません" };
    await admins.deleteAdmin(adminId);
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e);
  }
}
