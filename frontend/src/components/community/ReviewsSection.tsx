import { useEffect, useState } from "react";
import { Star, Quote, PenLine } from "lucide-react";
import { reviewsService, type ReviewDto } from "@/lib/api/extrasService";
import { Button } from "@/components/common/Button";
import { TextInput } from "@/components/common/TextInput";
import { Modal } from "@/components/common/Modal";

/**
 * Reviews wall — what other gig workers say. Backed by Postgres (reviews
 * table) and Redis-cached server-side; mock mode keeps them in localStorage.
 */
export function ReviewsSection() {
  const [reviews, setReviews] = useState<ReviewDto[] | null>(null);
  const [showWrite, setShowWrite] = useState(false);

  useEffect(() => {
    reviewsService.list().then(setReviews).catch(() => setReviews([]));
  }, []);

  const average = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-600 text-ledger-text">From gig workers</h2>
          <p className="mt-1 text-sm text-ledger-muted">
            Unvarnished notes from people who file like you do — platforms, TDS quirks and all.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {reviews && reviews.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Star size={16} className="fill-[#C98A3B] text-[#C98A3B]" />
              <span className="font-mono text-lg text-ledger-text">{average.toFixed(1)}</span>
              <span className="text-xs text-ledger-muted">({reviews.length})</span>
            </div>
          )}
          <Button variant="secondary" onClick={() => setShowWrite(true)}>
            <PenLine size={14} /> Write a review
          </Button>
        </div>
      </header>

      {reviews === null ? (
        <p className="py-8 text-center text-xs text-ledger-muted">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ledger-line py-12 text-center text-sm text-ledger-muted">
          No reviews yet — be the first to tell other gig workers how filing went.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <article key={r.id} className="flex flex-col gap-3 rounded-lg border border-ledger-line bg-ledger-panel p-5">
              <div className="flex items-center justify-between">
                <Stars rating={r.rating} />
                {r.platformName && (
                  <span className="rounded-full border border-ledger-line px-2 py-0.5 text-[11px] text-ledger-muted">{r.platformName}</span>
                )}
              </div>
              <h3 className="font-display text-sm font-600 text-ledger-text">{r.headline}</h3>
              <p className="flex-1 text-sm leading-relaxed text-ledger-muted">{r.body}</p>
              <footer className="flex items-center justify-between border-t border-ledger-line pt-3">
                <span className="text-xs font-medium text-ledger-text">{r.displayName}</span>
                <span className="text-[11px] text-ledger-muted">{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
              </footer>
            </article>
          ))}
        </div>
      )}

      {showWrite && (
        <WriteReviewModal
          onClose={() => setShowWrite(false)}
          onDone={() => {
            setShowWrite(false);
            reviewsService.list().then(setReviews).catch(() => undefined);
          }}
        />
      )}
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={14} className={i <= rating ? "fill-[#C98A3B] text-[#C98A3B]" : "text-ledger-line"} />
      ))}
    </div>
  );
}

function WriteReviewModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [platform, setPlatform] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (headline.trim().length < 3 || body.trim().length < 10) {
      setError("Give it a headline and at least a sentence of body.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await reviewsService.create({ rating, headline: headline.trim(), body: body.trim(), platformName: platform.trim() || undefined });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post your review.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Write a review" subtitle="What would you tell another gig worker about filing with Gig?" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ledger-muted">Rating</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} star${i > 1 ? "s" : ""}`}>
                <Star size={22} className={i <= rating ? "fill-[#C98A3B] text-[#C98A3B]" : "text-ledger-line"} />
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="One line that sums it up" />
          <TextInput label="Platform (optional)" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Swiggy, Upwork…" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ledger-muted">Your experience</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="rounded-md border border-ledger-line bg-ledger-base px-3 py-2 text-sm text-ledger-text outline-none transition-colors placeholder:text-ledger-muted/60 focus:border-signal-info/70"
            placeholder="What worked, what didn't, and what your CA said."
          />
        </div>
        {error && <p className="text-xs text-signal-overdue">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-ledger-line pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" loading={busy}>
            <Quote size={14} /> Post review
          </Button>
        </div>
      </form>
    </Modal>
  );
}
