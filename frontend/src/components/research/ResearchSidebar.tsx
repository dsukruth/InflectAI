import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/inflect-logo.png";
import type { Query } from "@/types/api";

interface ResearchSidebarProps {
  queries: Query[];
  activeQueryId: string | null;
  onSelect: (query: Query) => void;
  onClear?: () => void;
}

const navItems = [
  { icon: "home", label: "Home", to: "/app/home" },
  { icon: "research", label: "Research", to: "/app/research" },
  { icon: "markets", label: "Markets", to: "/app/portfolio" },
  { icon: "structures", label: "Structures", to: "/app/portfolio" },
  { icon: "history", label: "History", to: "/app/portfolio" },
];

const iconMap: Record<string, JSX.Element> = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  research: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  markets: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  structures: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  history: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  ),
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const ResearchSidebar = ({ queries, activeQueryId, onSelect, onClear }: ResearchSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{
        background: "rgba(6, 10, 18, 0.95)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 shrink-0" style={{ height: 56 }}>
        <img src={logo} alt="Inflect" style={{ height: 26 }} className="object-contain" />
        <button
          onClick={handleLogout}
          className="ml-auto transition-colors"
          style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}
          title="Log out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 px-2 mt-2 shrink-0">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to && item.label.toLowerCase() === (location.pathname.split("/").pop() || "");
          const isResearchActive = item.label === "Research" && location.pathname === "/app/research";
          const active = isActive || isResearchActive;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.to)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-left w-full"
              style={{
                background: active ? "rgba(0, 212, 255, 0.08)" : "transparent",
                color: active ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                borderLeft: active ? "2px solid hsl(var(--accent))" : "2px solid transparent",
              }}
            >
              {iconMap[item.icon]}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* History toggle */}
      <div className="flex items-center justify-between px-4 mt-6 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--muted-foreground))" }}>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          </svg>
          <span className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.12em" }}>
            History
          </span>
        </div>
        {/* Toggle switch */}
        <div
          className="relative cursor-pointer"
          style={{ width: 32, height: 18, borderRadius: 9, background: queries.length > 0 ? "hsl(var(--accent) / 0.3)" : "hsl(var(--muted))" }}
        >
          <div
            style={{
              position: "absolute",
              top: 2,
              left: queries.length > 0 ? 16 : 2,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: queries.length > 0 ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))",
              transition: "left 0.2s ease",
            }}
          />
        </div>
      </div>

      {/* Query history */}
      <div className="flex-1 overflow-y-auto px-2">
        {queries.length === 0 ? (
          <p className="font-mono text-center py-8" style={{ color: "hsl(var(--border))", fontSize: 11 }}>
            No queries yet
          </p>
        ) : (
          queries.slice(0, 15).map((q) => {
            const isActive = q.id === activeQueryId;
            return (
              <button
                key={q.id}
                onClick={() => onSelect(q)}
                className="w-full text-left px-3 py-2 rounded-md mb-0.5 transition-all duration-150"
                style={{
                  background: isActive ? "rgba(0, 212, 255, 0.06)" : "transparent",
                  borderLeft: isActive ? "2px solid hsl(var(--accent))" : "2px solid transparent",
                }}
              >
                <p className="truncate" style={{ color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", fontSize: 12 }}>
                  {q.transcript?.slice(0, 40) || "..."}
                </p>
                <span className="font-mono" style={{ color: "hsl(var(--border))", fontSize: 9 }}>
                  {timeAgo(q.created_at)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ResearchSidebar;
