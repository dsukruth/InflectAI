import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const ParticleCanvas = lazy(() => import("./ParticleCanvas"));

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" as const, delay },
});

const badges = [
  { emoji: "🔒", label: "SEC Verified" },
  { emoji: "⚡", label: "Wolfram|Alpha" },
  { emoji: "🎙️", label: "Voice + Chat" },
];

const Hero = () => {
  const isMobile = useIsMobile();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden video-section-fade">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/videos/hero_bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-background/40" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-20">
        <motion.div {...fadeIn(0.2)} className="inline-block mb-6">
          <span
            className="text-xs font-medium tracking-wider px-4 py-1.5 rounded-full"
            style={{
              border: "1px solid rgba(240,165,0,0.3)",
              background: "rgba(240,165,0,0.08)",
              color: "#F0A500",
            }}
          >
            [ AI Financial Research ]
          </span>
        </motion.div>

        <motion.h1
          {...fadeIn(0.4)}
          className="font-display font-bold text-[40px] md:text-[72px] leading-[1.05] mb-6"
          style={{
            background: "linear-gradient(135deg, hsl(38,100%,55%) 0%, hsl(0,68%,61%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 30px rgba(240,165,0,0.3))",
          }}
        >
          Find the Inflection Point.
        </motion.h1>

        <motion.p
          {...fadeIn(0.6)}
          className="text-base md:text-xl max-w-[600px] mx-auto mb-10"
          style={{ color: "hsl(220, 14%, 78%)" }}
        >
          Research any Fortune 500 in seconds. Voice or type — verified by SEC filings and
          Wolfram|Alpha.
        </motion.p>

        <motion.div {...fadeIn(0.8)} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <motion.div whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(240,165,0,0.4)" }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/register"
              className="font-semibold px-8 py-3 rounded-full text-sm inline-block"
              style={{ background: "#F0A500", color: "#080C14" }}
            >
              Start Demo
            </Link>
          </motion.div>
          <motion.a
            href="#dashboard-preview"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="font-semibold px-8 py-3 rounded-full text-sm"
            style={{ border: "1px solid #F0A500", color: "#F0A500" }}
          >
            Watch It Work
          </motion.a>
        </motion.div>

        <motion.div {...fadeIn(1.0)} className="flex flex-wrap justify-center gap-3">
          {badges.map((b, i) => (
            <motion.span
              key={b.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + i * 0.1, duration: 0.5 }}
              className="glass text-xs px-4 py-2 rounded-full"
              style={{
                border: "1px solid rgba(240,165,0,0.3)",
                background: "rgba(240,165,0,0.08)",
                color: "#F0A500",
              }}
            >
              {b.emoji} {b.label}
            </motion.span>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="w-6 h-6 animate-bounce-slow" style={{ color: "#F0A500" }} />
      </motion.div>
    </section>
  );
};

export default Hero;
