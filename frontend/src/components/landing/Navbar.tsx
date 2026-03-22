import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import InflectLogo from "./InflectLogo";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Demo", href: "#dashboard-preview" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(8,12,20,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid rgba(240,165,0,${scrolled ? 0.4 : 0.15})`,
        transition: "border-color 0.3s ease, background 0.3s ease",
      }}
    >
      <div className="w-full px-8 h-20 flex items-center justify-between">
        <Link to="/">
          <InflectLogo size={52} />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            className="text-sm transition-colors duration-200"
            style={{ color: "#8892A4", fontSize: 14 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#FFFFFF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#8892A4"; }}
          >
            Log In
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/register"
              className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full"
            >
              Start Demo
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
