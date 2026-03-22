import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const DashboardPreview = () => {
  const [ref, inView] = useInView({ triggerOnce: true, rootMargin: "-100px" });

  return (
    <section id="dashboard-preview" className="py-24 px-6">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="rounded-2xl overflow-hidden"
          style={{
            border: "1px solid rgba(240,165,0,0.2)",
            boxShadow: "0 0 60px rgba(240,165,0,0.1)",
          }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full block"
          >
            <source src="/videos/dashboard_peek.mp4" type="video/mp4" />
          </video>
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardPreview;
