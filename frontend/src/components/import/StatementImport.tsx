import { useCallback, useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckSquare,
  Square,
  Loader2,
  ScanText,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import { statementService, type ProposedTransaction, type StatementDto } from "@/lib/api/statementService";
import { platformsAtom } from "@/store/atoms";
import { useAtomValue } from "jotai";
import { Button } from "@/components/common/Button";
import { formatINR } from "@/lib/taxEngine";

/**
 * "Select file from device / upload bank statement" section.
 * Upload -> OCR (server: pdf-parse or tesseract) -> review proposed credit
 * transactions -> accept selected ones into the ledger under a platform.
 */
export function StatementImport() {
  const [statements, setStatements] = useState<StatementDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<ProposedTransaction[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const platforms = useAtomValue(platformsAtom);
  const [platformId, setPlatformId] = useState<string>("");

  useEffect(() => {
    statementService.list().then(setStatements).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!platformId && platforms.length > 0) setPlatformId(platforms[0].id);
  }, [platforms, platformId]);

  const openStatement = useCallback(async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await statementService.get(id);
      setActiveId(id);
      setTransactions(res.transactions);
      setSelected(new Set(res.transactions.filter((t) => !t.isAccepted).map((t) => t.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load that statement.");
    } finally {
      setBusy(false);
    }
  }, []);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!/\.(pdf|png|jpe?g)$/i.test(file.name)) {
      setError("Upload a PDF, PNG or JPG bank statement.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const res = await statementService.upload(file);
      const list = await statementService.list();
      setStatements(list);
      openStatement(res.statementId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAccept() {
    if (!activeId || selected.size === 0) return;
    if (!platformId) {
      setError("Add a platform first — imported income needs a home.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await statementService.accept(activeId, [...selected], platformId);
      setTransactions((prev) => prev.map((t) => (selected.has(t.id) ? { ...t, isAccepted: true } : t)));
      setSelected(new Set());
      setStatements((prev) =>
        prev.map((s) => (s.id === activeId ? { ...s, acceptedCount: s.acceptedCount + res.importedCount } : s))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  const active = statements.find((s) => s.id === activeId) ?? null;
  const pendingTotal = transactions.filter((t) => selected.has(t.id)).reduce((s, t) => s + t.amount, 0);

  return (
    <section className="flex flex-col gap-5">
      <header>
        <h2 className="font-display text-lg font-600 text-ledger-text">Import from bank statement</h2>
        <p className="mt-1 text-sm text-ledger-muted">
          Upload a statement and let OCR do the typing. Credits become income entries after you review them —
          nothing is added without your tick.
        </p>
      </header>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragOver ? "border-signal-info bg-signal-info/5" : "border-ledger-line bg-ledger-panel"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 size={28} className="animate-spin text-signal-info" />
            <p className="text-sm text-ledger-text">Running OCR… this takes a moment.</p>
            <p className="text-xs text-ledger-muted">Extracting text, matching dates and credit lines.</p>
          </>
        ) : (
          <>
            <UploadCloud size={28} className="text-ledger-muted" />
            <div>
              <p className="text-sm text-ledger-text">Drag your bank statement here</p>
              <p className="mt-0.5 text-xs text-ledger-muted">PDF, PNG or JPG · up to 10 MB · stays on your account</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <FileText size={14} />
              Select file from device
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-signal-overdue/40 bg-signal-overdue/10 px-3 py-2.5 text-xs text-signal-overdue">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Past statements */}
      {statements.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-ledger-muted">Your statements</h3>
          <div className="flex flex-col gap-2">
            {statements.map((s) => (
              <button
                key={s.id}
                onClick={() => openStatement(s.id)}
                className={`flex items-center justify-between rounded-md border px-4 py-3 text-left transition-colors ${
                  s.id === activeId ? "border-signal-info/60 bg-signal-info/5" : "border-ledger-line bg-ledger-panel hover:border-ledger-muted/40"
                }`}
              >
                <span className="flex items-center gap-3">
                  <FileText size={16} className="text-ledger-muted" />
                  <span>
                    <span className="block text-sm text-ledger-text">{s.fileName}</span>
                    <span className="block text-xs text-ledger-muted">
                      {new Date(s.uploadedAt).toLocaleDateString("en-IN")} ·{" "}
                      {s.ocrStatus === "done"
                        ? `${s.acceptedCount}/${s.txCount} imported`
                        : s.ocrStatus === "failed"
                          ? "OCR failed"
                          : "Processing…"}
                    </span>
                  </span>
                </span>
                {s.ocrStatus === "failed" ? (
                  <AlertTriangle size={16} className="text-signal-pending" />
                ) : (
                  <ScanText size={16} className="text-ledger-muted" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Review panel */}
      {active && (
        <div className="rounded-lg border border-ledger-line bg-ledger-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-600 text-ledger-text">
                {transactions.filter((t) => !t.isAccepted).length} transactions to review
              </h3>
              <p className="text-xs text-ledger-muted">Tick the credits that are gig income, then import them.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={platformId}
                onChange={(e) => setPlatformId(e.target.value)}
                className="rounded-md border border-ledger-line bg-ledger-base px-3 py-2 text-xs text-ledger-text outline-none focus:border-signal-info/70"
              >
                {platforms.length === 0 && <option value="">No platforms yet</option>}
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    Import under: {p.name}
                  </option>
                ))}
              </select>
              <Button variant="primary" onClick={handleAccept} loading={busy} disabled={selected.size === 0 || !platformId}>
                Import {selected.size > 0 ? `${selected.size} ` : ""}({formatINR(pendingTotal)})
              </Button>
            </div>
          </div>

          {busy && !uploading && <p className="mt-3 flex items-center gap-2 text-xs text-ledger-muted"><Loader2 size={12} className="animate-spin" /> Loading…</p>}

          <div className="mt-4 flex flex-col gap-2">
            {transactions.filter((t) => !t.isAccepted).length === 0 ? (
              <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-ledger-line py-8 text-xs text-ledger-muted">
                <Inbox size={14} /> Everything from this statement is already in your ledger.
              </div>
            ) : (
              transactions
                .filter((t) => !t.isAccepted)
                .map((t) => (
                  <label
                    key={t.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition-colors ${
                      selected.has(t.id) ? "border-signal-filed/50 bg-signal-filed/5" : "border-ledger-line bg-ledger-base hover:border-ledger-muted/40"
                    }`}
                  >
                    <input type="checkbox" className="sr-only" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
                    {selected.has(t.id) ? (
                      <CheckSquare size={16} className="shrink-0 text-signal-filed" />
                    ) : (
                      <Square size={16} className="shrink-0 text-ledger-muted" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ledger-text">{t.narration || t.rawText}</span>
                      <span className="block text-xs text-ledger-muted">
                        {t.txnDate ? new Date(t.txnDate).toLocaleDateString("en-IN") : "date not read"}
                        {t.counterparty ? ` · ${t.counterparty}` : ""}
                      </span>
                    </span>
                    <span className="font-mono text-sm text-signal-filed">+{formatINR(t.amount)}</span>
                  </label>
                ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
