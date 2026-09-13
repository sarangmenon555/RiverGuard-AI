"use client";

import { useState } from "react";
import { Send, Bot, Loader2 } from "lucide-react";
import type { DashboardResponse } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTED_QUESTIONS = [
  "Which districts are currently safest?",
  "Why is the river level rising?",
  "What should I do if my district moves to high risk?",
];

export default function ChatAssistant({
  dashboard,
  showHeader = false,
  districtName,
}: {
  dashboard?: DashboardResponse;
  showHeader?: boolean;
  districtName?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: districtName
        ? `Ask me anything about ${districtName}'s current flood risk — for example, "why is ${districtName} at this risk level?"`
        : 'Ask me about current flood risk anywhere in Keralam — for example, "why is Alappuzha at high risk?"',
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          context: dashboard,
        }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.reply || "No response available." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "I could not reach RiverGuard AI right now. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel flex h-[420px] flex-col rounded-2xl p-4">
      {showHeader && (
        <div className="mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-aqua-400" />
          <h3 className="font-semibold text-white">Ask RiverGuard AI</h3>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-aqua-500/20 text-aqua-100"
                : "bg-navy-700/60 text-slate-200"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" /> RiverGuard AI is thinking…
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="rounded-full border border-aqua-500/25 bg-navy-900/60 px-3 py-1 text-xs text-aqua-300 transition hover:border-aqua-400/50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask RiverGuard AI about any district..."
          className="flex-1 rounded-lg border border-aqua-500/20 bg-navy-900 px-3 py-2 text-sm text-white outline-none focus:border-aqua-400"
        />
        <button
          onClick={() => sendMessage(input)}
          className="rounded-lg bg-aqua-500 px-3 py-2 text-navy-950 transition hover:bg-aqua-400"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
