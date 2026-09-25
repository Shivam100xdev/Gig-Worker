import { useEffect, useState } from "react";
import { CalendarDays, CalendarCheck, RefreshCw, CheckCircle2, ExternalLink } from "lucide-react";
import { calendarExtrasService, type CalendarState } from "@/lib/api/extrasService";
import { Button } from "@/components/common/Button";

/**
 * ITR & advance-tax deadlines with one-click Google Calendar sync.
 * The backend holds OAuth tokens (calendar_tokens) and upserts events
 * idempotently — syncing twice never duplicates.
 */
export function DeadlineCard() {
  const [state, setState] = useState<CalendarState | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    calendarExtrasService.state().then(setState).catch(() => setState(null));
  }, []);

  async function handleConnect() {
    setBusy(true);
    setNotice(null);
    try {
      await calendarExtrasService.connect();
      // Real mode redirects to Google and back; mock mode resolves here.
      const s = await calendarExtrasService.state();
      setState(s);
      setNotice("Calendar connected. Sync the deadlines below to add events.");
    } catch {
      setNotice("Couldn't reach Google — make sure GOOGLE_CLIENT_ID/SECRET are set in backend/.env.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    setBusy(true);
    setNotice(null);
    try {
      await calendarExtrasService.sync();
      const s = await calendarExtrasService.state();
      setState(s);
      setNotice("Added to your Google Calendar with 1-day popup and 1-week email reminders.");
    } catch {
      setNotice("Sync failed — reconnect your calendar and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!state) return null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-ledger-line bg-ledger-panel p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-signal-info/10 text-signal-info">
            <CalendarDays size={16} />
          </div>
          <div>
            <h3 className="text-sm font-600 text-ledger-text">ITR & advance-tax deadlines</h3>
            <p className="text-[11px] text-ledger-muted">FY 2025-26 · reminders via Google Calendar</p>
          </div>
        </div>
        {state.connected && (
          <span className="flex items-center gap-1 text-[11px] text-signal-filed">
            <CheckCircle2 size={12} /> Connected
          </span>
        )}
      </div>

      <ul className="flex flex-col divide-y divide-ledger-line/60">
        {state.statutory.map((d) => {
          const due = new Date(`${d.dueDate}T00:00:00`);
          const past = due.getTime() < Date.now();
          return (
            <li key={`${d.label}-${d.dueDate}`} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
              <span className={`text-sm ${past ? "text-ledger-muted line-through" : "text-ledger-text"}`}>{d.label}</span>
              <span className="flex items-center gap-2 font-mono text-xs text-ledger-muted">
                {due.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {d.syncedToCalendar && <CalendarCheck size={13} className="text-signal-filed" />}
              </span>
            </li>
          );
        })}
      </ul>

      {notice && <p className="text-xs text-signal-info">{notice}</p>}

      <div className="flex gap-2">
        {!state.connected ? (
          <Button variant="secondary" onClick={handleConnect} loading={busy}>
            <ExternalLink size={14} /> Connect Google Calendar
          </Button>
        ) : (
          <Button variant="secondary" onClick={handleSync} loading={busy} disabled={state.statutory.every((d) => d.syncedToCalendar)}>
            <RefreshCw size={14} /> Sync deadlines to calendar
          </Button>
        )}
      </div>
    </div>
  );
}
