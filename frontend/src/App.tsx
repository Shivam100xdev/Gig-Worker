import { useAtomValue } from "jotai";
import { sessionUserAtom } from "@/store/atoms";
import { useSession } from "@/hooks/useSession";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { TaxpayerBar } from "@/components/layout/TaxpayerBar";
import { MainPanel } from "@/components/layout/MainPanel";
import { AddPlatformModal } from "@/components/platforms/AddPlatformModal";
import { ITRSummaryModal } from "@/components/itr/ITRSummaryModal";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";

export default function App() {
  const user = useAtomValue(sessionUserAtom);
  const { status } = useSession();

  if (status === "loading" || !user) {
    if (status === "loading") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ledger-base">
          <p className="text-sm text-ledger-muted">Loading…</p>
        </div>
      );
    }
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen flex-col bg-ledger-base text-ledger-text">
      <Header />
      <TaxpayerBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainPanel />
      </div>

      <AddPlatformModal />
      <ITRSummaryModal />
      <AssistantWidget />
    </div>
  );
}
