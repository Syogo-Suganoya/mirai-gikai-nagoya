"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import * as admins from "@/lib/admins/repository";
import { endSession, requireAdmin, startSession, verifyPassword } from "@/lib/auth/admin";
import { readHeader, rowToInput, type CsvRowResult } from "@/lib/bills/csv";
import {
  GENERATABLE_SECTIONS,
  generateSection,
  isAiConfigured,
  type GeneratableSection,
  type GenerateSource,
} from "@/lib/bills/generate";
import { agendaItems, matchesAgendaItem } from "@/data/agendas";
import { agendaToFormValues } from "@/lib/bills/from-agenda";
import { toInput } from "@/lib/bills/input";
import { BILLS_CACHE_TAG } from "@/lib/bills/queries";
import * as repo from "@/lib/bills/repository";
import { deleteThumbnail, detectImageType, saveThumbnail, THUMBNAIL_MAX_BYTES } from "@/lib/bills/thumbnails";
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
    refreshPublicSite(); // 下書きが増えると公開サイトの議案一覧から隠す議案が変わる
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

// ---- 議案一覧から件名のみで一括登録 ----

const BULK_LIMIT = 500;

// 選んだ議案一覧の行を、件名・番号・委員会・議決結果だけ入れた下書きとして登録する。
// すでに登録済みの議案と、slug が重なる議案は飛ばす
export async function registerAgendaItemsAction(
  ids: string[],
): Promise<ActionResult<{ created: number; skipped: number }>> {
  try {
    await requireAdmin();
    if (ids.length === 0) return { ok: false, error: "議案を選んでください" };
    if (ids.length > BULK_LIMIT) return { ok: false, error: `一度に登録できるのは${BULK_LIMIT}件までです` };
    const wanted = new Set(ids);
    const existing = await repo.listBills();
    const items = agendaItems.filter(
      (item) => wanted.has(item.id) && !existing.some((b) => matchesAgendaItem(b, item)),
    );
    const inputs = items.map((item) => formValuesToInput(billFormSchema.parse(agendaToFormValues(item))));
    const created = await repo.createBillsBulk(inputs);
    refreshPublicSite(); // 下書きにした議案を公開サイトの議案一覧から隠す
    return { ok: true, data: { created: created.length, skipped: ids.length - created.length } };
  } catch (e) {
    return failure(e);
  }
}

// ---- サムネイル画像 ----

// 画像はブラウザで縮小してから送られてくる。中身の先頭バイトで種類を確かめてから保存する
export async function uploadThumbnailAction(billId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "画像を選んでください" };
    if (file.size > THUMBNAIL_MAX_BYTES) return { ok: false, error: "画像が大きすぎます(1.5MB まで)" };
    const data = Buffer.from(await file.arrayBuffer());
    const type = detectImageType(data);
    if (!type) return { ok: false, error: "JPEG・PNG・WebP の画像を選んでください" };
    if (!(await repo.findBillById(billId))) return { ok: false, error: "議案が見つかりません" };
    await saveThumbnail(billId, type, data);
    refreshPublicSite();
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteThumbnailAction(billId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteThumbnail(billId);
    refreshPublicSite();
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e);
  }
}

// ---- AI でセクションを生成 ----

// 保存はしない。生成結果をフォームに入れるだけなので、確認・修正してから保存する
export async function generateSectionAction<S extends GeneratableSection>(
  section: S,
  source: GenerateSource,
): Promise<ActionResult<BillFormValues[S]>> {
  try {
    await requireAdmin();
    if (!GENERATABLE_SECTIONS.includes(section)) return { ok: false, error: "生成できないセクションです" };
    if (!isAiConfigured()) return { ok: false, error: "AI の APIキー(GOOGLE_GENERATIVE_AI_API_KEY)が設定されていません" };
    if (!source.summaryEasy.trim() && !source.summaryDetailed.trim()) {
      return { ok: false, error: "先に「かんたん解説」か「くわしい解説」を入力してください" };
    }
    return { ok: true, data: await generateSection(section, source) };
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

// 初期パスワードは自動で発行して返す。画面に一度だけ表示し、再表示はできない
export async function createAdminAction(email: string): Promise<ActionResult<{ email: string; password: string }>> {
  try {
    await requireAdmin();
    const { password } = await admins.createAdmin(email);
    return { ok: true, data: { email: email.trim(), password } };
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

// 自分のパスワードは「パスワード変更」で変える(再発行すると自分のセッションが消え、表示を見る前にログアウトするため)
export async function reissueAdminPasswordAction(
  adminId: string,
): Promise<ActionResult<{ email: string; password: string }>> {
  try {
    const me = await requireAdmin();
    if (me.id === adminId) return { ok: false, error: "自分のパスワードは「パスワード変更」で変えてください" };
    return { ok: true, data: await admins.reissuePassword(adminId) };
  } catch (e) {
    return failure(e);
  }
}

// 自分自身も削除できる(削除するとログアウトする)。最後の1人は削除できない
export async function deleteAdminAction(adminId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await admins.deleteAdmin(adminId);
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e);
  }
}
