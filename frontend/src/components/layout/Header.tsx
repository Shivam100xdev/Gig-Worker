import { useAtom, useAtomValue } from "jotai";
import { Landmark, LogOut } from "lucide-react";
import { FileITRButton } from "@/components/itr/FileITRButton";
import { sessionUserAtom, mainSectionAtom, incomeRecordsAtom } from "@/store/atoms";
import { useSession } from "@/hooks/useSession";

export function Header() {
  const user = useAtomValue(sessionUserAtom);
  const [section, setSection] = useAtom(mainSectionAtom);
  const records = useAtomValue(incomeRecordsAtom);
  const { logout } = useSession();

  return (
    <header className="flex items-center justify-between border-b border-ledger-line bg-ledger-panel px-6 py-3.5">
      <button className="flex items-center gap-2.5" onClick={() => setSection("dashboard")}>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rupee-soft text-rupee">
          <Landmark size={16} />
        </div>
        <div className="text-left">
          <h1 className="font-display text-sm font-600 leading-none text-ledger-text">Gig</h1>
          <p className="mt-0.5 text-[11px] leading-none text-ledger-muted">Gig income, one ledger</p>
        </div>
      </button>
      <div className="flex items-center gap-2">
        <nav className="mr-2 hidden items-center gap-1 sm:flex">
          {(
            [
              ["dashboard", "Ledger"],
              ["import", "Import"],
              ["gst", "GST"],
              ["deadlines", "Deadlines"],
              ["reviews", "Reviews"],
              ["faq", "FAQ"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                section === key ? "bg-ledger-raised text-ledger-text" : "text-ledger-muted hover:text-ledger-text"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <FileITRButton />
        <div className="ml-2 flex items-center gap-2 border-l border-ledger-line pl-3">
          <span className="hidden text-xs text-ledger-muted md:block">
            {user?.mobile} · {records.length} entries
          </span>
          <button
            onClick={() => logout()}
            className="rounded-sm p-1.5 text-ledger-muted transition-colors hover:bg-ledger-raised hover:text-signal-overdue"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
