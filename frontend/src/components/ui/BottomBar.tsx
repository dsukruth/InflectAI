import { usePortfolioStore } from "@/store/portfolioStore";
import { formatCurrency } from "@/utils/formatters";

const BottomBar = () => {
  const { totalValue, buyingPower } = usePortfolioStore();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between"
      style={{
        height: 36,
        background: "rgba(6, 10, 18, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px",
      }}
    >
      <div className="flex items-center gap-4">
        <span className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.08em" }}>
          Portfolio Value
        </span>
        <span className="font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 12, fontWeight: 600 }}>
          {formatCurrency(totalValue)}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.08em" }}>
          Buying Power
        </span>
        <span className="font-mono" style={{ color: "hsl(var(--primary))", fontSize: 12, fontWeight: 600 }}>
          {formatCurrency(buyingPower)}
        </span>
      </div>
    </div>
  );
};

export default BottomBar;
