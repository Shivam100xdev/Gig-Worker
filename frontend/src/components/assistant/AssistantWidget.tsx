import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Loader2, Sparkles } from "lucide-react";
import { assistantService, type ChatTurn } from "@/lib/api/extrasService";

/**
 * "Ask anything" — Gemini-powered assistant docked bottom-right.
 * Server-side proxy injects the user's live ledger context (totals, filing
 * status, checklist state) into the system prompt; history stays in the
 * component, nothing about the chat is persisted.
 */
const SUGGESTED = [
  "When is my ITR deadline?",
  "Do I need GST registration?",
  "What if a client deducted TDS?",
  "Which ITR form should I file?",
];

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const nextTurns: ChatTurn[] = [...turns, { role: "user", text: trimmed }];
    setTurns(nextTurns);
    setInput("");
    setBusy(true);
    try {
      const reply = await assistantService.chat(nextTurns);
      setTurns((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      const msg = err instanceof Error && /503|not configured/i.test(err.message)
        ? assistantService.fallbackMessage
        : "Couldn't reach the assistant. Check your connection and try again.";
      setTurns((prev) => [...prev, { role: "assistant", text: msg }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-ledger-line bg-ledger-raised px-4 py-3 shadow-xl transition-transform hover:scale-[1.03]"
          aria-label="Open AI assistant"
        >
          <Sparkles size={16} className="text-rupee" />
          <span className="text-sm font-medium text-ledger-text">Ask anything</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 flex h-[480px] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-ledger-line bg-ledger-panel shadow-2xl">
          <header className="flex items-center justify-between border-b border-ledger-line px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rupee-soft text-rupee">
                <Bot size={16} />
              </div>
              <div>
                <p className="text-sm font-600 leading-none text-ledger-text">Tax assistant</p>
                <p className="mt-1 text-[11px] leading-none text-ledger-muted">Knows your totals & deadlines · Gemini</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-sm p-1 text-ledger-muted hover:bg-ledger-raised hover:text-ledger-text" aria-label="Close assistant">
              <X size={16} />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {turns.length === 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-ledger-muted">
                  Ask me anything about your income, TDS, GST or deadlines — I can see your current ledger summary.
                </p>
                <div className="mt-2 flex flex-col gap-1.5">
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-md border border-ledger-line px-3 py-2 text-left text-xs text-ledger-text transition-colors hover:border-signal-info/50 hover:bg-signal-info/5"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((t, i) => (
              <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    t.role === "user"
                      ? "rounded-br-sm bg-signal-info/15 text-ledger-text"
                      : "rounded-bl-sm border border-ledger-line bg-ledger-raised text-ledger-text"
                  }`}
                >
                  {t.text}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg rounded-bl-sm border border-ledger-line bg-ledger-raised px-3 py-2">
                  <Loader2 size={13} className="animate-spin text-ledger-muted" />
                  <span className="text-xs text-ledger-muted">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 border-t border-ledger-line px-3 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about TDS, GST, deadlines…"
              className="min-w-0 flex-1 rounded-md border border-ledger-line bg-ledger-base px-3 py-2 text-sm text-ledger-text outline-none placeholder:text-ledger-muted/60 focus:border-signal-info/70"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="rounded-md bg-rupee p-2 text-ledger-base transition-opacity disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
