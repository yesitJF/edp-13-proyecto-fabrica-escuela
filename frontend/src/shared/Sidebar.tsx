type SidebarProps = {
  navItems: { id: string; label: string; icon: React.ReactNode }[];
  activeNav: string;
  onNav: (id: string) => void;
  userLabel: string;
  userSub: string;
  userInitials: string;
  badge?: React.ReactNode;
};

export default function Sidebar({ navItems, activeNav, onNav, userLabel, userSub, userInitials, badge }: SidebarProps) {
  return (
    <aside className="flex flex-col w-60 shrink-0 overflow-y-auto" style={{ background: "#0d0820", borderRight: "1px solid rgba(139,92,246,0.12)" }}>
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl font-bold text-sm" style={{ background: "linear-gradient(135deg,#6d28d9,#a855f7)", fontFamily: "Instrument Sans,sans-serif", color: "#fff" }}>
          BX
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>Banco X</div>
          <div className="text-xs" style={{ color: "#7c6fa0" }}>{badge}</div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
        {navItems.map((item) => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left w-full transition-all duration-150"
              style={{
                background: active ? "rgba(109,40,217,0.22)" : "transparent",
                color: active ? "#c4b5fd" : "#7c6fa0",
                border: active ? "1px solid rgba(139,92,246,0.2)" : "1px solid transparent",
              }}
              onMouseEnter={(ev) => { if (!active) { ev.currentTarget.style.background = "rgba(139,92,246,0.08)"; ev.currentTarget.style.color = "#a78bfa"; } }}
              onMouseLeave={(ev) => { if (!active) { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.color = "#7c6fa0"; } }}
            >
              <span style={{ color: active ? "#a78bfa" : "inherit" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0" style={{ background: "rgba(109,40,217,0.3)", color: "#c4b5fd" }}>
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: "#e2d9f3" }}>{userLabel}</div>
            <div className="text-xs truncate" style={{ color: "#7c6fa0" }}>{userSub}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
