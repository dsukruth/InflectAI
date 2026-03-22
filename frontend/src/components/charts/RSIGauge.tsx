interface RSIGaugeProps {
  value: number;
  ticker: string;
}

const getLabel = (v: number) => {
  if (v < 30) return { text: "Oversold", color: "#00D68F" };
  if (v > 70) return { text: "Overbought", color: "#E05555" };
  return { text: "Neutral", color: "#8892A4" };
};

// Convert 0-100 RSI value to SVG arc path on a semicircle
const polarToXY = (angleDeg: number, r: number, cx: number, cy: number) => {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const describeArc = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
  const s = polarToXY(startDeg, r, cx, cy);
  const e = polarToXY(endDeg, r, cx, cy);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
};

const RSIGauge = ({ value, ticker }: RSIGaugeProps) => {
  const label = getLabel(value);

  // SVG dimensions — gauge lives in a 200×120 viewBox
  const W = 200;
  const H = 120;
  const cx = W / 2;
  const cy = H - 10; // pivot near the bottom centre
  const outerR = 88;
  const innerR = 62;
  const needleR = 80;

  // RSI 0→100 maps to 0°→180° (left to right along the top)
  const rsiToDeg = (v: number) => (v / 100) * 180;
  const valueDeg = rsiToDeg(Math.min(100, Math.max(0, value)));

  // Zone arcs (0-30 red, 30-70 grey, 70-100 green)
  const zones = [
    { start: 0, end: 30, color: "rgba(224,85,85,0.35)" },
    { start: 30, end: 70, color: "rgba(136,146,164,0.15)" },
    { start: 70, end: 100, color: "rgba(0,214,143,0.35)" },
  ];

  // Tick marks at 0, 30, 70, 100
  const ticks = [
    { v: 0, label: "0" },
    { v: 30, label: "30" },
    { v: 70, label: "70" },
    { v: 100, label: "100" },
  ];

  // Needle as a thin line from center
  const needleDeg = valueDeg;
  const needleEnd = polarToXY(needleDeg, needleR, cx, cy);
  const needleBase1 = polarToXY(needleDeg - 90, 6, cx, cy);
  const needleBase2 = polarToXY(needleDeg + 90, 6, cx, cy);

  return (
    <div
      style={{
        background: "#0F1820",
        border: "1px solid #1E2D40",
        borderRadius: 12,
        padding: "14px 16px 10px",
        textAlign: "center",
      }}
    >
      <p className="font-mono" style={{ color: "#F0A500", fontSize: 13, marginBottom: 8 }}>
        {ticker} · RSI
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", overflow: "visible" }}
        aria-label={`RSI gauge showing ${value}`}
      >
        {/* Zone arcs — outer ring */}
        {zones.map((z) => (
          <path
            key={z.start}
            d={describeArc(cx, cy, outerR, rsiToDeg(z.start), rsiToDeg(z.end))}
            stroke={z.color}
            strokeWidth={outerR - innerR}
            fill="none"
            strokeLinecap="butt"
          />
        ))}

        {/* Track background */}
        <path
          d={describeArc(cx, cy, (outerR + innerR) / 2, 0, 180)}
          stroke="#1E2D40"
          strokeWidth={outerR - innerR + 2}
          fill="none"
          opacity={0.4}
        />

        {/* Zone arcs — drawn over track */}
        {zones.map((z) => (
          <path
            key={`fill-${z.start}`}
            d={describeArc(cx, cy, (outerR + innerR) / 2, rsiToDeg(z.start), rsiToDeg(z.end))}
            stroke={z.color}
            strokeWidth={outerR - innerR - 2}
            fill="none"
          />
        ))}

        {/* Value arc — gold fill up to current RSI */}
        <path
          d={describeArc(cx, cy, (outerR + innerR) / 2, 0, valueDeg)}
          stroke="#F0A500"
          strokeWidth={outerR - innerR - 6}
          fill="none"
          strokeLinecap="round"
        />

        {/* Tick marks */}
        {ticks.map((t) => {
          const inner = polarToXY(rsiToDeg(t.v), innerR - 4, cx, cy);
          const outer = polarToXY(rsiToDeg(t.v), outerR + 4, cx, cy);
          const labelPt = polarToXY(rsiToDeg(t.v), outerR + 14, cx, cy);
          return (
            <g key={t.v}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#8892A4" strokeWidth={1} />
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#8892A4"
                fontSize={9}
                fontFamily="monospace"
              >
                {t.label}
              </text>
            </g>
          );
        })}

        {/* Needle */}
        <polygon
          points={`${needleBase1.x},${needleBase1.y} ${needleEnd.x},${needleEnd.y} ${needleBase2.x},${needleBase2.y}`}
          fill="#F0A500"
          opacity={0.9}
        />
        <circle cx={cx} cy={cy} r={5} fill="#F0A500" />
        <circle cx={cx} cy={cy} r={3} fill="#0F1820" />

        {/* Value label */}
        <text
          x={cx}
          y={cy - 22}
          textAnchor="middle"
          fill="#F0A500"
          fontSize={22}
          fontWeight={700}
          fontFamily="monospace"
        >
          {Math.round(value)}
        </text>
      </svg>

      <p className="font-mono" style={{ color: label.color, fontSize: 13, fontWeight: 700, marginTop: 2 }}>
        {label.text}
      </p>
    </div>
  );
};

export default RSIGauge;
