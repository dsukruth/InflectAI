import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Mic, ShieldCheck, TrendingUp } from "lucide-react";

const cards = [
  {
    icon: Mic,
    iconColor: "#F0A500",
    accent: "#F0A500",
    title: "Voice & Chat",
    body: "Ask in natural language. Get cited answers in under 3 seconds.",
    badge: "ElevenLabs TTS",
    badgeBg: "rgba(240,165,0,0.12)",
    badgeBorder: "rgba(240,165,0,0.3)",
    badgeColor: "#F0A500",
  },
  {
    icon: ShieldCheck,
    iconColor: "#00D68F",
    accent: "#00D68F",
    title: "Zero Hallucination",
    body: "Every claim verified by SEC filings or Wolfram|Alpha. We always cite sources.",
    badge: "Wolfram Verified",
    badgeBg: "rgba(0,214,143,0.12)",
    badgeBorder: "rgba(0,214,143,0.3)",
    badgeColor: "#00D68F",
  },
  {
    icon: TrendingUp,
    iconColor: "#E05555",
    accent: "#E05555",
    title: "Paper Trading",
    body: "Execute simulated trades with $100K virtual portfolio. Zero real risk.",
    badge: "$100K Portfolio",
    badgeBg: "rgba(240,165,0,0.12)",
    badgeBorder: "rgba(240,165,0,0.3)",
    badgeColor: "#F0A500",
  },
];

const Features = () => {
  const [ref, inView] = useInView({ triggerOnce: true, rootMargin: "-100px" });

  return (
    <section id="features" className="py-24 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-primary text-xs tracking-[0.2em] uppercase mb-4">Why Inflect</p>
          <h2 className="font-display font-bold text-foreground text-3xl md:text-[48px] leading-tight">
            Three layers of<br />financial intelligence
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              whileHover={{
                y: -4,
                borderColor: card.accent,
                boxShadow: `0 0 30px ${card.accent}26`,
              }}
              className="glass rounded-2xl border border-border pt-6 px-8 pb-8 transition-colors"
            >
              <div className="w-10 h-10 mb-2 flex items-center justify-center">
                <card.icon size={40} color={card.iconColor} />
              </div>
              <h3 className="font-display font-semibold text-foreground text-xl mb-3">{card.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">{card.body}</p>
              <span
                className="inline-block text-[11px] font-medium px-3 py-1 rounded-full"
                style={{
                  background: card.badgeBg,
                  border: `1px solid ${card.badgeBorder}`,
                  color: card.badgeColor,
                }}
              >
                {card.badge}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
