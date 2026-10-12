"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
  type FieldPath,
  type UseFormRegister,
} from "react-hook-form";
import { councils } from "@/data/councils";
import { billFormSchema, type BillFormValues } from "@/lib/bills/schema";
import {
  BILL_ILLUSTRATIONS,
  BILL_STATUSES,
  billStatusLabels,
  illustrationLabels,
} from "@/lib/bills/types";
import { createBillAction, updateBillAction } from "../actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-zinc-800">{label}</span>
      {hint && <span className="ml-2 text-xs text-zinc-500">{hint}</span>}
      {children}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

// エラーメッセージを入れ子のパス(例: keyPoints.0.title)から取り出す
function errorAt(errors: FieldErrors<BillFormValues>, path: string): string | undefined {
  let node: unknown = errors;
  for (const key of path.split(".")) {
    node = (node as Record<string, unknown> | undefined)?.[key];
  }
  return (node as { message?: string } | undefined)?.message;
}

type SectionName = "keyPoints" | "reasons" | "debatePoints" | "affectedGroups";

// 「行を追加・削除できる入力欄の繰り返し」(この法律のポイント などの4セクション)
function RepeatableSection<F extends string>({
  name,
  title,
  description,
  fields: fieldDefs,
  emptyRow,
  control,
  register,
  errors,
}: {
  name: SectionName;
  title: string;
  description: string;
  fields: { key: F; label: string; multiline?: boolean }[];
  emptyRow: Record<F, string>;
  control: ReturnType<typeof useForm<BillFormValues>>["control"];
  register: UseFormRegister<BillFormValues>;
  errors: FieldErrors<BillFormValues>;
}) {
  const { fields, append, remove, move } = useFieldArray({ control, name });
  return (
    <Card title={title} description={description}>
      {fields.length === 0 && <p className="text-xs text-zinc-400">まだありません</p>}
      {fields.map((row, i) => (
        <div key={row.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-semibold">{i + 1}</span>
            <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className="ml-auto disabled:opacity-30">
              ↑
            </button>
            <button type="button" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} className="disabled:opacity-30">
              ↓
            </button>
            <button type="button" onClick={() => remove(i)} className="text-rose-600">
              削除
            </button>
          </div>
          <div className="space-y-2">
            {fieldDefs.map((f) => {
              const path = `${name}.${i}.${f.key}` as FieldPath<BillFormValues>;
              return (
                <Field key={f.key} label={f.label} error={errorAt(errors, path)}>
                  {f.multiline ? (
                    <textarea rows={2} className={inputClass} {...register(path)} />
                  ) : (
                    <input className={inputClass} {...register(path)} />
                  )}
                </Field>
              );
            })}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append(emptyRow as never)}
        className="rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
      >
        ＋ 行を追加
      </button>
    </Card>
  );
}

export default function BillForm({
  mode,
  id,
  defaultValues,
}: {
  mode: "create" | "edit";
  id?: string;
  defaultValues: BillFormValues;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BillFormValues>({ resolver: zodResolver(billFormSchema), defaultValues });

  const thumbnailType = useWatch({ control, name: "thumbnailType" });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    if (mode === "create") {
      const result = await createBillAction(values);
      if (!result.ok) return setServerError(result.error);
      router.push(`/admin/bills/${result.data.id}/edit?created=1`);
    } else {
      const result = await updateBillAction(id!, values);
      if (!result.ok) return setServerError(result.error);
      setSavedAt(new Date().toLocaleTimeString("ja-JP"));
      router.refresh();
    }
  });

  const e = (path: string) => errorAt(errors, path);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card title="基本情報">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="議会" error={e("council")}>
            <select className={inputClass} {...register("council")}>
              {councils.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="URL 識別子(slug)" hint="公開URL /bills/◯◯ になる。半角英小文字・数字・ハイフン" error={e("slug")}>
            <input className={`${inputClass} font-mono`} {...register("slug")} placeholder="nagoya-2026-02-1" />
          </Field>
          <Field label="会期" error={e("sessionName")}>
            <input className={inputClass} {...register("sessionName")} placeholder="令和8年2月定例会" />
          </Field>
          <Field label="議案番号" error={e("billNumber")}>
            <input className={inputClass} {...register("billNumber")} placeholder="第1号" />
          </Field>
        </div>
        <Field label="議案名" error={e("name")}>
          <input className={inputClass} {...register("name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="審議の状況" error={e("status")}>
            <select className={inputClass} {...register("status")}>
              {BILL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {billStatusLabels[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="付託委員会" error={e("committee")}>
            <input className={inputClass} {...register("committee")} placeholder="財政福祉委員会" />
          </Field>
          <Field label="提出日" error={e("submittedDate")}>
            <input type="date" className={inputClass} {...register("submittedDate")} />
          </Field>
          <Field label="議決日" error={e("decidedDate")}>
            <input type="date" className={inputClass} {...register("decidedDate")} />
          </Field>
        </div>
        <Field label="出典 URL" hint="議会の議案一覧ページなど" error={e("sourceUrl")}>
          <input className={inputClass} {...register("sourceUrl")} placeholder="https://" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="タグ" hint="カンマ区切り" error={e("tagsText")}>
            <input className={inputClass} {...register("tagsText")} placeholder="予算💰, 財政" />
          </Field>
          <Field label="表示順" hint="小さいほど上(議会ごと)" error={e("displayOrder")}>
            <input type="number" className={inputClass} {...register("displayOrder", { valueAsNumber: true })} />
          </Field>
        </div>
      </Card>

      <Card title="サムネイル" description="写真(loremflickr)は読み込めないときに代わりのイラストを出します">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="種類">
            <select className={inputClass} {...register("thumbnailType")}>
              <option value="none">なし</option>
              <option value="illustration">イラスト</option>
              <option value="photo">キーワード連動の写真</option>
            </select>
          </Field>
          {thumbnailType === "illustration" && (
            <Field label="イラスト">
              <select className={inputClass} {...register("illustration")}>
                {BILL_ILLUSTRATIONS.map((k) => (
                  <option key={k} value={k}>
                    {illustrationLabels[k]}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {thumbnailType === "photo" && (
            <>
              <Field label="写真のキーワード" error={e("photoKeyword")}>
                <input className={`${inputClass} font-mono`} {...register("photoKeyword")} placeholder="baby,nursery,japan" />
              </Field>
              <Field label="代わりのイラスト">
                <select className={inputClass} {...register("photoFallback")}>
                  {BILL_ILLUSTRATIONS.map((k) => (
                    <option key={k} value={k}>
                      {illustrationLabels[k]}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
        </div>
      </Card>

      <Card
        title="解説"
        description="公開サイトのヘッダーの「もっと詳しく」スイッチで切り替わります。ふりがなは保存時に自動で付きます"
      >
        <Field label="かんたん解説" error={e("summaryEasy")}>
          <textarea rows={4} className={inputClass} {...register("summaryEasy")} />
        </Field>
        <Field label="くわしい解説" error={e("summaryDetailed")}>
          <textarea rows={6} className={inputClass} {...register("summaryDetailed")} />
        </Field>
        <Field
          label="会議録の要約"
          hint="AIチャットに渡す材料。公開ページには表示されません"
          error={e("minutesText")}
        >
          <textarea rows={5} className={inputClass} {...register("minutesText")} />
        </Field>
      </Card>

      <RepeatableSection
        name="keyPoints"
        title="🎯 この法律のポイント"
        description="見出しと本文の組み合わせ"
        fields={[
          { key: "title", label: "見出し" },
          { key: "body", label: "本文", multiline: true },
        ]}
        emptyRow={{ title: "", body: "" }}
        control={control}
        register={register}
        errors={errors}
      />
      <RepeatableSection
        name="reasons"
        title="✏️ この法律が必要な理由"
        description="見出しと本文の組み合わせ"
        fields={[
          { key: "title", label: "見出し" },
          { key: "body", label: "本文", multiline: true },
        ]}
        emptyRow={{ title: "", body: "" }}
        control={control}
        register={register}
        errors={errors}
      />
      <RepeatableSection
        name="debatePoints"
        title="👀 意見が分かれるところ"
        description="論点ごとに、期待される効果と注意が必要なところを書く"
        fields={[
          { key: "topic", label: "論点" },
          { key: "benefit", label: "👍 期待される効果", multiline: true },
          { key: "caution", label: "☝️ 注意が必要なところ", multiline: true },
        ]}
        emptyRow={{ topic: "", benefit: "", caution: "" }}
        control={control}
        register={register}
        errors={errors}
      />
      <RepeatableSection
        name="affectedGroups"
        title="🙋 影響を受ける人"
        description="誰に、どんな影響があるか"
        fields={[
          { key: "who", label: "影響を受ける人" },
          { key: "effect", label: "影響の内容", multiline: true },
        ]}
        emptyRow={{ who: "", effect: "" }}
        control={control}
        register={register}
        errors={errors}
      />

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {isSubmitting ? "保存中…(ふりがなを生成しています)" : mode === "create" ? "下書きとして作成" : "保存"}
        </button>
        {Object.keys(errors).length > 0 && (
          <span className="text-sm text-rose-600">入力内容にエラーがあります</span>
        )}
        {serverError && <span className="text-sm text-rose-600">{serverError}</span>}
        {savedAt && !serverError && <span className="text-sm text-emerald-700">保存しました({savedAt})</span>}
      </div>
    </form>
  );
}
