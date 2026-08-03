"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatWidget({
  billId,
  suggestions,
  placeholder = "わからないことをAIに質問する",
  emptyText = "気になることを質問できます。",
}: {
  billId?: string;
  suggestions?: string[];
  placeholder?: string;
  emptyText?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(question: string) {
    if (!question || isLoading) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId, messages: nextMessages }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setError("回答の取得に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input.trim());
  }

  return (
    <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-zinc-500">{emptyText}</p>
            {suggestions && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage(s)}
                    disabled={isLoading}
                    className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-lg bg-amber-500 px-3 py-2 text-sm text-white"
                : "mr-auto max-w-[85%] rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-900"
            }
          >
            {m.content}
          </div>
        ))}
        {isLoading && (
          <div className="mr-auto max-w-[85%] rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
            考え中…
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-full border border-amber-300 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          aria-label="送信"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white disabled:opacity-50"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
