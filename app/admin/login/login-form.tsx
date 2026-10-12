"use client";

import { useActionState } from "react";
import { signIn } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="mt-4 space-y-3">
      <label className="block text-sm">
        <span className="font-medium">メールアドレス</span>
        <input
          name="email"
          type="email"
          defaultValue={state?.email}
          key={state?.email}
          required
          autoComplete="username"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">パスワード</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber-500 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {pending ? "ログイン中…" : "ログイン"}
      </button>
    </form>
  );
}
