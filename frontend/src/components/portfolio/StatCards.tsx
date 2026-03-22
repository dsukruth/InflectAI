import { formatCurrency, formatPercent } from "@/utils/formatters";

interface StatCardsProps {
  portfolioValue: number;
  todayPnl: number;
  buyingPower: number;
  positionCount: number;
  isLoading: boolean;
}

const Shimmer = () => (
  <div
    className="h-7 rounded"
    style={{
      background: "linear-gradient(90deg, hsl(var(--border)) 25%, hsl(var(--muted)) 50%, hsl(var(--border)) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }}
  />
);

const StatCards = ({ portfolioValue, todayPnl, buyingPower, positionCount, isLoading }: StatCardsProps) => {
  const cards = [
    { label: "PORTFOLIO VALUE", value: formatCurrency(portfolioValue), color: "hsl(var(--foreground))" },
    {
      label: "TODAY'S P&L",
      value: `${todayPnl >= 0 ? "+" : ""}${formatCurrency(todayPnl)}`,
      color: todayPnl >= 0 ? "hsl(var(--bull))" : "hsl(var(--bear))",
    },
    { label: "BUYING POWER", value: formatCurrency(buyingPower), color: "hsl(var(--cyan))" },
    { label: "POSITIONS", value: String(positionCount), color: "hsl(var(--gold))" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl"
          style={{
            background: "#0F1820",
            border: "1px solid hsl(var(--border))",
            borderTop: "2px solid hsl(var(--gold))",
            padding: 16,
          }}
        >
          <p
            className="uppercase"
            style={{ color: "hsl(var(--muted-foreground))", fontSize: 11, letterSpacing: "0.5px", marginBottom: 8 }}
          >
            {c.label}
          </p>
          {isLoading ? <Shimmer /> : (
            <p className="font-mono font-bold" style={{ color: c.color, fontSize: 22 }}>{c.value}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatCards;
