import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { formatCurrency } from "@/utils/formatters";
import { toast } from "sonner";
import type { LiveQuote } from "@/hooks/useStockQuotes";

const API_URL =
  import.meta.env.VITE_API_URL || "https://inflect-backend-symvnfqjla-uc.a.run.app";

interface Props {
  onTradeComplete: () => void;
  quotes: Record<string, LiveQuote>;
}

const QuickTrade = ({ onTradeComplete, quotes: liveQuotes }: Props) => {
  const { user } = useAuthStore();
  const { buyingPower, positions } = usePortfolioStore();

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [orderType, setOrderType] = useState("Market");
  const [estPrice, setEstPrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Search autocomplete state
  const [searchResults, setSearchResults] = useState<{ symbol: string; description: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchTicker = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 1) { setSearchResults([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/market/quote?ticker=${query}`);
        if (res.ok) {
          const data = await res.json();
          // Build a single result from the quote endpoint
          setSearchResults([{ symbol: query.toUpperCase(), description: data.ticker || query.toUpperCase() }]);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
          setShowDropdown(false);
        }
      } catch {
        setSearchResults([]);
        setShowDropdown(false);
      }
      setSearching(false);
    }, 300);
  }, []);

  const fetchPrice = useCallback(async (t: string) => {
    if (!t) { setEstPrice(null); return; }
    setFetchingPrice(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/market/quote?ticker=${t}`);
      if (res.ok) {
        const data = await res.json();
        setEstPrice(data.price);
      } else {
        setEstPrice(null);
      }
    } catch { setEstPrice(null); }
    setFetchingPrice(false);
  }, []);

  const selectTicker = useCallback((symbol: string) => {
    setTicker(symbol);
    setShowDropdown(false);
    setSearchResults([]);
    fetchPrice(symbol);
  }, [fetchPrice]);


  const estTotal = estPrice ? estPrice * quantity : 0;
  const fillPrice = estPrice ? estPrice * (side === "buy" ? 1.0005 : 0.9995) : 0;
  const fillTotal = fillPrice * quantity;

  const isBuy = side === "buy";

  const handlePlaceOrder = () => {
    if (!ticker || !estPrice || quantity < 1) {
      toast.error("Please enter a valid ticker and quantity");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!user || !estPrice) return;
    setExecuting(true);

    try {
      if (isBuy) {
        if (buyingPower < fillTotal) {
          toast.error("Insufficient funds");
          setExecuting(false);
          setShowConfirm(false);
          return;
        }
        // Update buying power
        await supabase.from("profiles").update({ buying_power: buyingPower - fillTotal }).eq("id", user.id);
        // Insert trade
        await supabase.from("trades").insert({
          user_id: user.id,
          ticker: ticker.toUpperCase(),
          side: "buy",
          quantity,
          fill_price: fillPrice,
          total_value: fillTotal,
          status: "filled",
        });
        // Upsert position
        const existing = positions.find((p) => p.ticker === ticker.toUpperCase());
        if (existing) {
          const newQty = existing.quantity + quantity;
          const newAvg = (existing.avg_cost_basis * existing.quantity + fillPrice * quantity) / newQty;
          await supabase.from("positions").update({ quantity: newQty, avg_cost_basis: newAvg }).eq("id", existing.id);
        } else {
          await supabase.from("positions").insert({
            user_id: user.id,
            ticker: ticker.toUpperCase(),
            quantity,
            avg_cost_basis: fillPrice,
          });
        }
        toast.success(`Order filled at ${formatCurrency(fillPrice)}. You own ${(existing?.quantity ?? 0) + quantity} ${ticker.toUpperCase()}.`);
      } else {
        // SELL
        const existing = positions.find((p) => p.ticker === ticker.toUpperCase());
        if (!existing || existing.quantity < quantity) {
          toast.error("Insufficient shares");
          setExecuting(false);
          setShowConfirm(false);
          return;
        }
        await supabase.from("profiles").update({ buying_power: buyingPower + fillTotal }).eq("id", user.id);
        await supabase.from("trades").insert({
          user_id: user.id,
          ticker: ticker.toUpperCase(),
          side: "sell",
          quantity,
          fill_price: fillPrice,
          total_value: fillTotal,
          status: "filled",
        });
        const newQty = existing.quantity - quantity;
        if (newQty <= 0) {
          await supabase.from("positions").delete().eq("id", existing.id);
        } else {
          await supabase.from("positions").update({ quantity: newQty }).eq("id", existing.id);
        }
        toast.success(`Sold ${quantity} ${ticker.toUpperCase()} at ${formatCurrency(fillPrice)}.`);
      }

      setShowConfirm(false);
      setTicker("");
      setEstPrice(null);
      setQuantity(10);
      onTradeComplete();
    } catch (err) {
      toast.error("Trade failed. Please try again.");
    }
    setExecuting(false);
  };

  return (
    <>
      <div
        className="rounded-2xl relative overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(24px)",
          padding: 20,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Gold glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none" style={{ background: "#F0A500", filter: "blur(100px)", opacity: 0.08 }} />

        <p className="uppercase tracking-widest mb-4 relative z-10" style={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}>
          QUICK TRADE
        </p>

        {/* BUY / SELL toggle */}
        <div className="grid grid-cols-2 gap-0 rounded-xl p-1 mb-4 relative z-10" style={{ background: "#080C14" }}>
          {(["buy", "sell"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className="font-bold text-sm tracking-wider py-2 rounded-lg transition-all"
              style={{
                background: side === s ? (s === "buy" ? "rgba(0,214,143,0.2)" : "rgba(224,85,85,0.2)") : "transparent",
                color: side === s ? (s === "buy" ? "hsl(var(--bull))" : "hsl(var(--bear))") : "hsl(var(--muted-foreground))",
                boxShadow: side === s ? `0 0 12px ${s === "buy" ? "rgba(0,214,143,0.2)" : "rgba(224,85,85,0.2)"}` : "none",
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="space-y-3 relative z-10">
          <div className="relative" ref={dropdownRef}>
            <label className="uppercase text-xs tracking-wider block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Ticker</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setTicker(val);
                searchTicker(val);
              }}
              onBlur={() => {
                // Delay to allow dropdown click
                setTimeout(() => fetchPrice(ticker), 200);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowDropdown(false);
                if (e.key === "Enter" && searchResults.length > 0) {
                  selectTicker(searchResults[0].symbol);
                }
              }}
              placeholder="Search stock... e.g. AAPL"
              className="w-full font-mono text-sm rounded-xl px-3 py-2.5 transition-colors outline-none"
              style={{
                background: "#0F1820",
                border: "1px solid hsl(var(--border))",
                color: "white",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "hsl(var(--cyan))";
                e.currentTarget.style.background = "rgba(0,200,255,0.05)";
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              onFocusCapture={() => {}}
            />
            {/* Search dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div
                className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden"
                style={{
                  background: "#0F1820",
                  border: "1px solid hsl(var(--border))",
                  zIndex: 30,
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {searchResults.map((r) => (
                  <button
                    key={r.symbol}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors"
                    style={{ borderBottom: "1px solid hsl(var(--border))" }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectTicker(r.symbol)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,200,255,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span className="font-mono font-bold" style={{ color: "hsl(var(--cyan))", fontSize: 13 }}>{r.symbol}</span>
                    <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}>{r.description}</span>
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <div className="absolute right-3 top-9">
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--cyan))", borderTopColor: "transparent" }} />
              </div>
            )}
          </div>

          <div>
            <label className="uppercase text-xs tracking-wider block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full font-mono text-sm rounded-xl px-3 py-2.5 outline-none"
              style={{ background: "#0F1820", border: "1px solid hsl(var(--border))", color: "white" }}
            />
          </div>

          <div>
            <label className="uppercase text-xs tracking-wider block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Order Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full font-mono text-sm rounded-xl px-3 py-2.5 outline-none appearance-none"
              style={{ background: "#0F1820", border: "1px solid hsl(var(--border))", color: "white" }}
            >
              <option>Market</option>
              <option>Limit</option>
              <option>Stop-Loss</option>
            </select>
          </div>
        </div>

        {/* Price preview */}
        <div className="rounded-xl p-3 my-4 relative z-10" style={{ background: "#080C14", border: "1px solid hsl(var(--border))" }}>
          <div className="flex justify-between py-1">
            <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>Est. Price</span>
            <span className="font-mono" style={{ color: "white", fontSize: 13 }}>
              {fetchingPrice ? "..." : estPrice ? formatCurrency(estPrice) : "—"}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>Slippage</span>
            <span className="font-mono" style={{ color: "hsl(var(--gold))", fontSize: 13 }}>±0.05%</span>
          </div>
          <div className="my-1" style={{ borderTop: "1px solid hsl(var(--border))" }} />
          <div className="flex justify-between py-1">
            <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>Est. Total</span>
            <span className="font-mono font-bold" style={{ color: "white", fontSize: 13 }}>
              {estPrice ? formatCurrency(estTotal) : "—"}
            </span>
          </div>
        </div>

        {/* Place order button */}
        <button
          onClick={handlePlaceOrder}
          className="w-full rounded-xl font-bold py-3 transition-all relative z-10"
          style={{
            background: isBuy ? "hsl(var(--gold))" : "hsl(var(--bear))",
            color: isBuy ? "#080C14" : "white",
            boxShadow: isBuy ? "0 4px 20px rgba(240,165,0,0.3)" : "0 4px 20px rgba(224,85,85,0.3)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
        >
          Place {isBuy ? "Buy" : "Sell"} Order →
        </button>

        <p className="font-mono mt-3 text-center relative z-10" style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>
          Buying Power: <span className="font-mono" style={{ color: "hsl(var(--cyan))" }}>{formatCurrency(buyingPower)}</span>
        </p>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
          <div className="rounded-2xl p-7 w-[340px]" style={{ background: "#0F1820", border: "1px solid rgba(0,200,255,0.2)" }}>
            <h2 className="font-bold text-lg mb-5" style={{ color: "white" }}>
              Confirm {isBuy ? "BUY" : "SELL"} Order
            </h2>

            <div className="space-y-2 mb-4">
              {[
                { label: "Action", value: `${side.toUpperCase()} ${quantity} shares` },
                { label: "Ticker", value: ticker },
                { label: "Order Type", value: orderType },
                { label: "Est. Price", value: formatCurrency(estPrice!) },
                { label: "Fill Price", value: formatCurrency(fillPrice) },
                { label: "Slippage", value: "±0.05%" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between" style={{ padding: "6px 0" }}>
                  <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>{r.label}</span>
                  <span className="font-mono" style={{ color: "white", fontSize: 13 }}>{r.value}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid hsl(var(--border))", margin: "4px 0" }} />
              <div className="flex justify-between">
                <span className="font-semibold" style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>Total</span>
                <span className="font-mono font-bold" style={{ color: "white" }}>{formatCurrency(fillTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={executing}
                className="rounded-xl py-2.5 transition-colors"
                style={{ background: "transparent", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={executing}
                className="rounded-xl py-2.5 font-bold transition-colors"
                style={{
                  background: isBuy ? "hsl(var(--gold))" : "hsl(var(--bear))",
                  color: isBuy ? "#080C14" : "white",
                }}
              >
                {executing ? "..." : "Confirm"}
              </button>
            </div>

            <p className="text-center mt-3" style={{ color: "#3d5570", fontSize: 10 }}>
              Paper trading only. Not investment advice.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickTrade;
