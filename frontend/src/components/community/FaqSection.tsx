import { useEffect, useState } from "react";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import { faqService, type FaqDto } from "@/lib/api/extrasService";

/**
 * FAQ accordion — served from Postgres via a Redis-cached endpoint, so it
 * renders instantly on repeat visits.
 */
export function FaqSection() {
  const [faqs, setFaqs] = useState<FaqDto[]>([]);
  const [openId, setOpenId] = useState<number | string | null>(null);

  useEffect(() => {
    faqService.list().then(setFaqs).catch(() => setFaqs([]));
  }, []);

  return (
    <section className="flex flex-col gap-5">
      <header>
        <h2 className="font-display text-lg font-600 text-ledger-text">Frequently asked questions</h2>
        <p className="mt-1 text-sm text-ledger-muted">The questions gig workers actually ask before filing season.</p>
      </header>

      {faqs.length === 0 ? (
        <p className="py-8 text-center text-xs text-ledger-muted">No FAQs loaded yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {faqs.map((f) => {
            const open = openId === f.id;
            return (
              <div key={f.id} className="overflow-hidden rounded-lg border border-ledger-line bg-ledger-panel">
                <button
                  onClick={() => setOpenId(open ? null : f.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-ledger-text">
                    <MessageCircleQuestion size={16} className="shrink-0 text-ledger-muted" />
                    {f.question}
                  </span>
                  <ChevronDown size={16} className={`shrink-0 text-ledger-muted transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <p className="border-t border-ledger-line px-5 py-4 pl-[3.25rem] text-sm leading-relaxed text-ledger-muted">
                    {f.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
