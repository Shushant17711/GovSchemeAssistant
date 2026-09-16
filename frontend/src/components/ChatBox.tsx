import { Send } from "lucide-react";
import { useState } from "react";
import { chatWithScheme } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import type { ChatMessage } from "../lib/types";

export function ChatBox({ schemeId }: { schemeId: string }) {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);
    try {
      const res = await chatWithScheme(schemeId, userMsg.content, language, messages);
      const replyText = res.reply ?? res.error ?? "Something went wrong.";
      setMessages([...newHistory, { role: "assistant", content: replyText }]);
    } catch {
      setMessages([...newHistory, { role: "assistant", content: "Could not reach the server." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-gray-900">Ask a question about this scheme</h3>
      <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-sm ${
              m.role === "user" ? "ml-8 bg-brand-50 text-brand-900" : "mr-8 bg-gray-100 text-gray-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="mr-8 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-400">Thinking...</div>}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="e.g. What documents do I need?"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-md bg-brand-600 px-3 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
