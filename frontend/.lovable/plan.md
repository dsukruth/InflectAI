

# Inflect — AI Financial Research Landing Page

## Overview
A production-quality, dark-themed single-page landing page with Three.js particle hero, Framer Motion animations, Lottie illustrations, video showcases, and glassmorphism design throughout.

## Design System
- **Background:** #080C14, **Card:** #0F1820, **Border:** #1E2D40
- **Cyan accent:** #00C8FF, **Bull green:** #00D68F, **Bear red:** #E05555, **Gold:** #F0A500
- **Fonts:** Space Grotesk (headlines), Inter (body), JetBrains Mono (numbers) via Google Fonts
- **Radii:** 12px cards, 999px pills/buttons

## Dependencies
framer-motion, three, @react-three/fiber@^8.18, @react-three/drei@^9.122.0, @lottiefiles/react-lottie-player, react-intersection-observer

## Sections (top to bottom)

### 1. Sticky Navbar
Glassmorphism bar with blur(20px), border brightens on scroll. Left: "INFLECT" + cyan lightning icon. Right: nav links + cyan "Start Demo" pill button with Framer Motion hover/tap.

### 2. Hero (100vh) + Three.js Background
Full-screen canvas with 2000 drifting particles (white/cyan), mouse-repel wave effect, and two pulsing orbs (green left, red right). Overlaid content: AI badge pill → "Find the Inflection Point." headline (72px) → subheadline → two CTA buttons → three trust badges → bouncing scroll chevron. All staggered Framer Motion fadeIn.

### 3. Logo Strip
Dark strip with "RESEARCH ANY OF THESE COMPANIES" label. Infinite CSS marquee of 12 company logos via Logo.dev API (user provides token). Grayscale default, color on hover.

### 4. Dashboard Preview
Video (`dashboard_peek.mp4`) fading in on scroll with cyan glow border.

### 5. Features — "Why Inflect"
Three glassmorphism cards with Lottie animations, staggered scroll entry, hover glow matching each card's accent:
- Voice & Chat (cyan) — mic/waveform Lottie
- Zero Hallucination (green) — shield Lottie
- Paper Trading (red) — chart Lottie

### 6. Voice Button Showcase
Centered `voice_button.mp4` video with pulsing cyan glow + descriptive text below.

### 7. How It Works
Three steps (Speak → Verify → Answer) with Lottie icons, connected by a dashed cyan line that draws on scroll.

### 8. Bull vs Bear
`hero_bg.mp4` video background with dark overlay. "Bull or Bear — Inflect tells you why." headline + three verdict badges (HOLD/WATCH/AVOID).

### 9. Stats
Three stat cards with cyan/green monospace numbers, count-up animation on scroll: "<3s", "540K+", "$0".

### 10. Dashboard Full
Full-width `dashboard_full.mp4` video scaling up from 0.95→1.0 on scroll.

### 11. CTA
Gradient background, large headline, cyan "Start for Free" button with glow on hover.

### 12. Footer
Dark footer with brand, link columns, and "Built at HooHacks 2026 🦉 UVA" credit.

## Mobile Responsive
- Three.js canvas replaced with static gradient on mobile (<768px)
- Hero headline scales to 40px, buttons go full-width, cards stack vertically
- Videos still autoplay on mobile

## Performance
- Lazy-load all videos with poster frames
- Three.js capped at 60fps
- Lottie plays only when in viewport
- Logo images use loading="lazy"

## File Structure
- `src/pages/Index.tsx` — main landing page composing all sections
- `src/components/landing/` — Navbar, Hero, ParticleCanvas, LogoStrip, DashboardPreview, Features, VoiceShowcase, HowItWorks, BullBear, Stats, DashboardFull, CTA, Footer
- Videos copied to `public/videos/`

