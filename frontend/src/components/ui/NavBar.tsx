import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { useTicker, type MarketStatus } from "@/hooks/useTicker";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";

const navLinks = [
  { to: "/app/home", label: "Home" },
  { to: "/app/portfolio", label: "Portfolio" },
  { to: "/app/research", label: "Research" },
];

const statusLabel: Record<MarketStatus, { text: string; color: string }> = {
  live: { text: "MARKET OPEN", color: "hsl(var(--bull))" },
  premarket: { text: "PRE-MARKET", color: "hsl(var(--gold))" },
  afterhours: { text: "AFTER HOURS", color: "hsl(var(--gold))" },
  closed: { text: "MARKET CLOSED", color: "hsl(var(--muted-foreground))" },
};

const NavBar = () => {
  const { user } = useAuthStore();
  const { buyingPower } = usePortfolioStore();
  const { quotes, marketStatus } = useTicker();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initial = user?.email ? user.email.substring(0, 2).toUpperCase() : "?";
  const ms = statusLabel[marketStatus];

  // Find S&P 500 or a proxy
  const spx = quotes.find((q) => q.ticker === "SPY") || quotes[0];
  const spxUp = spx ? spx.direction === "up" : true;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
      style={{
        height: 56,
        background: "rgba(6, 10, 18, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid hsl(var(--border))",
        padding: "0 32px",
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate("/")}>
        <span className="text-xl font-bold" style={{ color: "white" }}>in</span>
        <span className="text-xl font-bold" style={{ color: "hsl(var(--gold))" }}>flect</span>
      </div>

      {/* Center: Tabs */}
      <div className="flex items-center gap-6">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="transition-colors duration-200"
              style={{
                color: isActive ? "white" : "hsl(var(--muted-foreground))",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                paddingBottom: 4,
                borderBottom: isActive ? "2px solid hsl(var(--gold))" : "2px solid transparent",
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "white"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Right: Status + Buying Power + Avatar */}
      <div className="flex items-center gap-5">
        {/* Market status */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {marketStatus === "live" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: ms.color }} />}
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: ms.color }} />
          </span>
          <span className="font-mono text-xs" style={{ color: ms.color }}>{ms.text}</span>
        </div>

        {/* S&P proxy */}
        {spx && (
          <span className="font-mono text-xs" style={{ color: spxUp ? "hsl(var(--bull))" : "hsl(var(--bear))" }}>
            S&P 500 {spxUp ? "+" : ""}{spx.change.toFixed(2)}%
          </span>
        )}

        {/* Buying Power */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Buying Power</span>
          <span className="font-mono text-xs font-bold" style={{ color: "hsl(var(--cyan))" }}>{formatCurrency(buyingPower)}</span>
        </div>

        {/* Avatar */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, hsl(var(--cyan)), hsl(210, 80%, 50%))",
              color: "white",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
            }}
          >
            {initial}
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-2 glass-panel"
              style={{ padding: 4, minWidth: 140 }}
            >
              <button
                onClick={handleLogout}
                className="w-full text-left transition-colors duration-150"
                style={{ padding: "8px 16px", color: "hsl(var(--muted-foreground))", fontSize: 14, borderRadius: 6 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,212,255,0.06)";
                  e.currentTarget.style.color = "hsl(var(--foreground))";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
