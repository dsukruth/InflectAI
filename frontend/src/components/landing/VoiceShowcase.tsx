import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const VoiceShowcase = () => {
  const [ref, inView] = useInView({ triggerOnce: true, rootMargin: "-100px" });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden video-section-fade" ref={ref}>
      {/* Full-screen background video */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/voice_showcase.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-background/50" />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-xs tracking-[0.2em] uppercase mb-4" style={{ color: "#F0A500" }}
        >
          Inflect Listens
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-2xl md:text-4xl font-bold tracking-tight text-foreground"
        >
          Click the mic. Ask anything about a stock.
        </motion.h2>
      </div>
    </section>
  );
};

export default VoiceShowcase;
