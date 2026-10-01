"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import type { AppUser, ChatMessage } from "@/lib/types";
import { useSession } from "@/components/SessionProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import Avatar from "@/components/Avatar";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const session = useSession();
  const confirm = useConfirm();
  const isAdmin = session.role === "admin";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function refresh() {
    const res = await fetch("/api/chat");
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers);
    refresh();
    pollRef.current = setInterval(refresh, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText("");
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: value }),
    });
    refresh();
  }

  async function remove(id: string) {
    const ok = await confirm({
      title: "Delete this message?",
      description: "This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/chat/${id}`, { method: "DELETE" });
    refresh();
  }

  function avatarFor(authorId: string) {
    return users.find((u) => u._id === authorId)?.avatarUrl;
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] max-w-2xl flex-col">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <Send size={17} />
        </span>
        <div>
          <h1 className="font-logo text-2xl uppercase leading-none tracking-wide text-ink">Chat</h1>
          <p className="text-sm text-slate-500">Group chat for everyone on SplitSesh.</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/avatars/skunk.jpg" alt="" className="h-16 w-16 rounded-2xl object-cover shadow-card" />
              <p className="text-sm text-slate-400">No messages yet — say something.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isSelf = m.authorId === session.uid;
              const canDelete = isAdmin || isSelf;
              return (
                <div key={m._id} className={`group flex items-start gap-2 ${isSelf ? "flex-row-reverse" : ""}`}>
                  <Avatar name={m.authorName} avatarUrl={avatarFor(m.authorId)} size="sm" />
                  <div className={`max-w-[75%] ${isSelf ? "items-end text-right" : ""}`}>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {!isSelf && <span className="font-medium text-slate-500">{m.authorName}</span>}
                      <span>{formatTime(m.createdAt)}</span>
                      {canDelete && (
                        <button
                          onClick={() => remove(m._id)}
                          className="opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                    <p
                      className={`mt-0.5 inline-block whitespace-pre-wrap break-words rounded-xl px-3 py-1.5 text-sm ${
                        isSelf ? "bg-ink text-white" : "bg-slate-100 text-ink"
                      }`}
                    >
                      {m.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-200 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white hover:bg-slate-700"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
