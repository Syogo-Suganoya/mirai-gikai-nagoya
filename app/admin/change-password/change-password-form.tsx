"use client";

import { useActionState } from "react";
import { changeInitialPasswordAction } from "../actions";

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeInitialPasswordAction, null);
  return (
    <form action={action} className="mt-4 space-y-3">
      <label className="block text-sm">
        <span className="font-medium">新しいパスワード</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">新しいパスワード(確認)</span>
        <input
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber-500 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {pending ? "変更中…" : "変更して管理画面へ"}
      </button>
    </form>
  );
}
