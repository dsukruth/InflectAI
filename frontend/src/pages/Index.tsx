import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import LogoStrip from "@/components/landing/LogoStrip";
import DashboardPreview from "@/components/landing/DashboardPreview";
import Features from "@/components/landing/Features";
import VoiceShowcase from "@/components/landing/VoiceShowcase";
import HowItWorks from "@/components/landing/HowItWorks";
import BullBear from "@/components/landing/BullBear";
import Stats from "@/components/landing/Stats";
import DashboardFull from "@/components/landing/DashboardFull";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

const Index = () => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-background"
    >
      <Navbar />
      <Hero />
      <LogoStrip />
      <DashboardPreview />
      <Features />
      <VoiceShowcase />
      <HowItWorks />
      <BullBear />
      <Stats />
      <DashboardFull />
      <CTA />
      <Footer />
    </motion.div>
  </AnimatePresence>
);

export default Index;
