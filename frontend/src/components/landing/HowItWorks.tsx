import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Mic, ShieldCheck, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Mic,
    iconColor: "#F0A500",
    title: "Speak or Type",
    desc: "Ask about any Fortune 500 in plain English",
  },
  {
    icon: ShieldCheck,
    iconColor: "#F0A500",
    title: "AI Verifies",
    desc: "SEC filings + Wolfram|Alpha check every single claim",
  },
  {
    icon: TrendingUp,
    iconColor: "#F0A500",
    title: "Get Answers",
    desc: "Cited answer + interactive chart in under 3 seconds",
  },
];

const HowItWorks = () => {
  const [ref, inView] = useInView({ triggerOnce: true, rootMargin: "-100px" });

  return (
    <section id="how-it-works" className="py-24 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-primary text-xs tracking-[0.2em] uppercase mb-4">How It Works</p>
          <h2 className="font-display font-bold text-foreground text-3xl md:text-[48px] leading-tight">
            Three simple steps
          </h2>
        </motion.div>

        <div className="relative grid md:grid-cols-3 gap-10">
          {/* Connecting dashed line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0 origin-left"
            style={{ borderTop: "2px dashed rgba(240,165,0,0.4)" }}
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.15 }}
              className="text-center relative z-10"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl glass border border-border flex items-center justify-center">
                <step.icon size={40} color={step.iconColor} />
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
