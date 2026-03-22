import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const verdicts = [
  { label: "✓ HOLD", color: "rgba(0,214,143,0.25)", border: "rgba(0,214,143,0.6)", text: "#00D68F" },
  { label: "👁 WATCH", color: "rgba(240,165,0,0.25)", border: "rgba(240,165,0,0.6)", text: "#F0A500" },
  { label: "⚠ AVOID", color: "rgba(224,85,85,0.25)", border: "rgba(224,85,85,0.6)", text: "#E05555" },
];

const BullBear = () => {
  const [ref, inView] = useInView({ triggerOnce: true, rootMargin: "-100px" });

  return (
    <section className="relative min-h-[80vh] flex items-center px-6 overflow-hidden video-section-fade" ref={ref}>
      {/* Video bg */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/bull_bear.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0" style={{ background: "rgba(8,12,20,0.50)" }} />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="font-display font-bold text-foreground text-3xl md:text-[48px] leading-tight mb-6"
        >
          Bull or Bear — Inflect tells you why.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-base md:text-lg mb-10 max-w-xl mx-auto" style={{ color: "hsl(220, 14%, 78%)" }}
        >
          Fundamental + Technical + Sentiment signals synthesized into one verdict.
        </motion.p>

        <div className="flex flex-wrap justify-center gap-4">
          {verdicts.map((v, i) => (
            <motion.span
              key={v.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.5 }}
              className="glass text-sm font-semibold px-6 py-2.5 rounded-full"
              style={{ background: v.color, border: `1px solid ${v.border}`, color: v.text }}
            >
              {v.label}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BullBear;
