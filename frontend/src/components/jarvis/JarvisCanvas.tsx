import { useEffect, useRef } from "react";

const JarvisCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let w = 0;
    let h = 0;

    interface Particle { x: number; y: number; speed: number }
    const particles: Particle[] = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    const init = () => {
      resize();
      particles.length = 0;
      for (let i = 0; i < 40; i++) {
        particles.push({ x: Math.random() * w, y: Math.random() * h, speed: 0.2 + Math.random() * 0.4 });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "rgba(240,165,0,0.025)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = 0; x < w; x += 80) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y < h; y += 60) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      // Concentric circles
      const cx = w * 0.35;
      const cy = h * 0.5;
      ctx.strokeStyle = "rgba(240,165,0,0.04)";
      ctx.lineWidth = 0.5;
      for (const r of [200, 350, 500, 650]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Particles
      ctx.fillStyle = "rgba(240,165,0,0.12)";
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fill();
        p.y -= p.speed;
        if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
      }

      raf = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
};

export default JarvisCanvas;
