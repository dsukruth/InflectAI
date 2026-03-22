import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const DashboardFull = () => {
  const [ref, inView] = useInView({ triggerOnce: true, rootMargin: "-100px" });

  return (
    <section className="py-24 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="rounded-2xl overflow-hidden"
          style={{
            border: "1px solid rgba(240,165,0,0.15)",
          }}
        >
          <video autoPlay muted loop playsInline className="w-full block">
            <source src="/videos/dashboard_full.mp4" type="video/mp4" />
          </video>
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardFull;
