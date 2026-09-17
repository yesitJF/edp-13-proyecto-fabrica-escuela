import { useState } from "react";
import DepositView from "./views/DepositView";
import WithdrawView from "./views/WithdrawView";
import TransferView from "./views/TransferView";
import ClientView from "./views/ClientView";
import ManagerView from "./views/ManagerView";

type View = "deposit" | "withdraw" | "transfer" | "client" | "manager";

const VIEWS: { key: View; label: string }[] = [
  { key: "deposit", label: "Cliente — HU-03-01-03" },
  { key: "withdraw", label: "Cliente — HU-03-01-02" },
  { key: "transfer", label: "Cliente — HU-03-01-01" },
  { key: "client", label: "Cliente — HU-02-01-01" },
  { key: "manager", label: "Gestor — HU-01-01-01" },
];

export default function App() {
  const [view, setView] = useState<View>("deposit");

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "DM Sans,sans-serif" }}>
      <div className="flex items-center justify-center gap-2 py-2 shrink-0" style={{ background: "#080614", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
        <span className="text-xs" style={{ color: "#4c1d95" }}>Vista:</span>
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
            style={{ background: view === v.key ? "rgba(109,40,217,0.3)" : "transparent", color: view === v.key ? "#c4b5fd" : "#4c1d95", border: `1px solid ${view === v.key ? "rgba(139,92,246,0.4)" : "rgba(139,92,246,0.1)"}` }}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {view === "deposit" && <DepositView />}
        {view === "withdraw" && <WithdrawView />}
        {view === "transfer" && <TransferView />}
        {view === "client" && <ClientView />}
        {view === "manager" && <ManagerView />}
      </div>
    </div>
  );
}
