import { useEffect, useRef } from "react";

const TICKERS = ['AAPL','MSFT','NVDA','TSLA','AMZN','META','GOOGL','JPM','V','AMD','NFLX','INTC','BA','GS','WMT'];
const PRICES = ['+2.4%','-1.8%','+0.9%','-0.4%','+3.1%','-2.2%','+1.5%','-0.7%','$189','$892','$415','$245'];
const TERMS = ['P/E','EPS','RSI','MACD','SEC','10-K','RAG','AI','BUY','HOLD','ETF','IPO','FCF','YOY','Q4'];

function pickChar() {
  const r = Math.random();
  if (r < 0.4) return TICKERS[Math.floor(Math.random() * TICKERS.length)];
  if (r < 0.7) return PRICES[Math.floor(Math.random() * PRICES.length)];
  return TERMS[Math.floor(Math.random() * TERMS.length)];
}

interface Column {
  y: number;
  speed: number;
  char: string;
  bright: boolean;
  active: boolean;
}

const MatrixCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let cols: Column[] = [];
    const COL_W = 20;

    const initCols = () => {
      const count = Math.floor(canvas.width / COL_W);
      cols = Array.from({ length: count }, () => ({
        y: -(Math.random() * 500 + 50),
        speed: 1 + Math.random() * 2,
        char: pickChar(),
        bright: Math.random() < 0.05,
        active: Math.random() < 0.3,
      }));
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initCols();
    };

    resize();

    const draw = () => {
      // Fade overlay
      ctx.fillStyle = "rgba(8,12,20,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = "bold 12px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";

      for (let i = 0; i < cols.length; i++) {
        const c = cols[i];
        if (!c.active) {
          if (Math.random() < 0.005) c.active = true;
          continue;
        }

        const x = i * COL_W + COL_W / 2;
        const isPrice = c.char.startsWith("+") || c.char.startsWith("-");
        const isPositive = c.char.startsWith("+");
        const isNegative = c.char.startsWith("-");

        // Trail
        const trailAlphas = [0.7, 0.4, 0.2, 0.08, 0.03];
        for (let t = 0; t < trailAlphas.length; t++) {
          const ty = c.y - (t + 1) * 18;
          if (ty < 0) continue;
          if (c.bright) {
            ctx.fillStyle = `rgba(255,255,255,${trailAlphas[t] * 0.6})`;
          } else if (isPrice && isPositive) {
            ctx.fillStyle = `rgba(0,214,143,${trailAlphas[t]})`;
          } else if (isPrice && isNegative) {
            ctx.fillStyle = `rgba(224,85,85,${trailAlphas[t]})`;
          } else {
            ctx.fillStyle = `rgba(240,165,0,${trailAlphas[t]})`;
          }
          ctx.fillText(c.char, x, ty);
        }

        // Head
        if (c.y > 0) {
          if (c.bright) {
            ctx.fillStyle = "#FFFFFF";
          } else if (isPrice && isPositive) {
            ctx.fillStyle = "#00D68F";
          } else if (isPrice && isNegative) {
            ctx.fillStyle = "#E05555";
          } else {
            ctx.fillStyle = "#F0A500";
          }
          ctx.fillText(c.char, x, c.y);
        }

        c.y += c.speed;

        if (c.y > canvas.height + 50) {
          c.y = -(Math.random() * 450 + 50);
          c.char = pickChar();
          c.speed = 1 + Math.random() * 2;
          c.bright = Math.random() < 0.05;
          if (Math.random() < 0.15) c.active = false;
        }
      }

      raf = requestAnimationFrame(draw);
    };

    // Initial clear
    ctx.fillStyle = "#080C14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: "100vw", height: "100vh", background: "#080C14" }}
    />
  );
};

export default MatrixCanvas;
