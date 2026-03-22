import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 80;
const PARTICLE_COLOR = "rgba(240,165,0,0.06)";
const GRID_COLOR = "rgba(240,165,0,0.03)";
const GLOW_COLOR = "rgba(240,165,0,0.04)";
const GLOW_RADIUS = 600;
const GRID_X = 100;
const GRID_Y = 80;

interface Particle {
  x: number;
  y: number;
  r: number;
  speed: number;
}

const AmbientCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let w = 0;
    let h = 0;

    const particles: Particle[] = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    const init = () => {
      resize();
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1 + Math.random() * 1.5,
          speed: 0.15 + Math.random() * 0.3,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Radial glow
      const grd = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, GLOW_RADIUS);
      grd.addColorStop(0, GLOW_COLOR);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += GRID_X) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += GRID_Y) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Particles
      ctx.fillStyle = PARTICLE_COLOR;
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.y -= p.speed;
        if (p.y < -4) {
          p.y = h + 4;
          p.x = Math.random() * w;
        }
      }

      raf = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default AmbientCanvas;
