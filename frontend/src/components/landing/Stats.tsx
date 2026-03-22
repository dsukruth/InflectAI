import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";

function useCountUp(target: string, inView: boolean) {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (!inView) return;
    // Simple count-up for numeric portions
    const numMatch = target.match(/(\d+)/);
    if (!numMatch) { setDisplay(target); return; }

    const num = parseInt(numMatch[1]);
    const prefix = target.slice(0, target.indexOf(numMatch[1]));
    const suffix = target.slice(target.indexOf(numMatch[1]) + numMatch[1].length);
    const duration = 1500;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(num * eased);
      setDisplay(`${prefix}${current.toLocaleString()}${suffix}`);
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [inView, target]);

  return display;
}

const stats = [
  { value: "<3s", accent: "#F0A500", label: "Average response time" },
  { value: "540K+", accent: "#F0A500", label: "SEC filing chunks indexed" },
  { value: "$0", accent: "#E05555", label: "Hallucinated numbers. Ever." },
];

const Stats = () => {
  const [ref, inView] = useInView({ triggerOnce: true, rootMargin: "-100px" });

  return (
    <section className="py-24 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const val = useCountUp(stat.value, inView);
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className="bg-card rounded-lg p-8 text-center"
              style={{ borderTop: `2px solid ${stat.accent}` }}
            >
              <p className="font-mono text-5xl md:text-[64px] font-bold mb-3" style={{ color: stat.accent }}>
                {val}
              </p>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default Stats;
