interface BottomBarProps {
  portfolioValue: number;
  buyingPower: number;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const BottomBar = ({ portfolioValue, buyingPower }: BottomBarProps) => (
  <div
    className="h-12 flex items-center justify-between px-8 border-t border-border shrink-0"
    style={{ background: "rgba(15,24,32,0.95)" }}
  >
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Portfolio Value</span>
      <span className="font-mono text-sm text-foreground">{fmt(portfolioValue)}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Buying Power</span>
      <span className="font-mono text-sm" style={{ color: "#F0A500" }}>{fmt(buyingPower)}</span>
    </div>
  </div>
);

export default BottomBar;
