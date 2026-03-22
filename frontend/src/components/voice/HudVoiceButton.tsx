import { useState, useEffect, useRef, useCallback } from "react";
import useVoiceRecorder from "@/hooks/useVoiceRecorder";
import { useInflectToast } from "@/components/ui/InflectToast";
import { transcribeAudio } from "@/api/query";
import type { VoiceState } from "./VoiceButton";

interface HudVoiceButtonProps {
  onTranscript: (text: string, confidence: number) => void;
  onStateChange: (state: VoiceState) => void;
  disabled?: boolean;
}

const GOLD = "#F0A500";
const RED = "#E05555";
const TAU = Math.PI * 2;

const corners = [
  { angle: -135, label: "VOICE MODE", align: "left" as const },
  { angle: -45, label: "ACTIVE", align: "right" as const, dot: true },
  { angle: 135, label: "SEC VERIFIED", align: "left" as const },
  { angle: 45, label: "WOLFRAM AI", align: "right" as const },
];

const processingLabels = ["Transcribing...", "Analyzing...", "Generating..."];

const HudVoiceButton = ({ onTranscript, onStateChange, disabled = false }: HudVoiceButtonProps) => {
  const [state, setState] = useState<VoiceState>("idle");
  const [hovered, setHovered] = useState(false);
  const [flash, setFlash] = useState(false);
  const [labelIdx, setLabelIdx] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const waveOffsetsRef = useRef<number[]>(Array.from({ length: 32 }, () => Math.random() * TAU));

  const { startRecording, stopRecording, audioBlob, isRecording, audioLevel } = useVoiceRecorder();
  const { showToast } = useInflectToast();
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { onStateChange(state); }, [state, onStateChange]);

  useEffect(() => {
    if (state !== "processing") { setLabelIdx(0); return; }
    const iv = setInterval(() => setLabelIdx(i => (i + 1) % processingLabels.length), 1500);
    return () => clearInterval(iv);
  }, [state]);

  // Silence detection
  useEffect(() => {
    if (!isRecording) {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      return;
    }
    if (audioLevel < 0.02) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => { stopRecording(); setState("processing"); }, 2000);
      }
    } else {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    }
  }, [audioLevel, isRecording, stopRecording]);

  // Transcribe
  useEffect(() => {
    if (!audioBlob || state !== "processing") return;
    let cancelled = false;
    (async () => {
      try {
        const r = await transcribeAudio(audioBlob);
        if (!cancelled) onTranscript(r.transcript, r.confidence);
      } catch {
        if (!cancelled) onTranscript("Sample voice transcript — wire up your STT backend", 0.5);
      } finally {
        if (!cancelled) setState("idle");
      }
    })();
    return () => { cancelled = true; };
  }, [audioBlob, state, onTranscript]);

  const handleClick = useCallback(async () => {
    if (disabled) return;
    if (state === "idle") {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      const granted = await startRecording();
      if (!granted) { showToast("Microphone access denied.", "error"); return; }
      setState("recording");
    } else if (state === "recording") {
      stopRecording();
      setState("processing");
    }
  }, [state, disabled, startRecording, stopRecording, showToast]);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const size = 320;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    const cx = size / 2;
    const cy = size / 2;
    startTimeRef.current = performance.now();

    const drawRing = (t: number, radius: number, lineWidth: number, opacity: number, speed: number, segments: number, gapDeg: number) => {
      ctx.strokeStyle = `rgba(240,165,0,${opacity})`;
      ctx.lineWidth = lineWidth;
      const segArc = ((360 - segments * gapDeg) / segments) * (Math.PI / 180);
      const gapArc = gapDeg * (Math.PI / 180);
      const rot = (t * speed * Math.PI) / 180;
      for (let i = 0; i < segments; i++) {
        const start = rot + i * (segArc + gapArc);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, start, start + segArc);
        ctx.stroke();
      }
    };

    const drawWaveformBars = (t: number, isRec: boolean) => {
      const offsets = waveOffsetsRef.current;
      const barRadius = 120;
      for (let i = 0; i < 32; i++) {
        const angle = (i / 32) * TAU - Math.PI / 2;
        const baseH = 6;
        const animH = isRec
          ? 6 + 18 * Math.abs(Math.sin(t * 3 + offsets[i]))
          : 6 + 8 * Math.abs(Math.sin(t * 1.2 + offsets[i]));
        const h = Math.max(baseH, animH);
        const x1 = cx + Math.cos(angle) * barRadius;
        const y1 = cy + Math.sin(angle) * barRadius;
        const x2 = cx + Math.cos(angle) * (barRadius + h);
        const y2 = cy + Math.sin(angle) * (barRadius + h);
        ctx.strokeStyle = `rgba(240,165,0,0.6)`;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    const drawScanLine = (t: number) => {
      const y = cy - 150 + ((t * 50) % 300);
      const grad = ctx.createLinearGradient(cx - 140, y, cx + 140, y);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.3, "rgba(240,165,0,0.15)");
      grad.addColorStop(0.7, "rgba(240,165,0,0.15)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(cx - 140, y, 280, 2);
    };

    const drawCornerBrackets = () => {
      const r = 200;
      const bLen = 30;
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(240,165,0,0.4)`;

      corners.forEach((c) => {
        const a = (c.angle * Math.PI) / 180;
        const bx = cx + Math.cos(a) * (r * 0.55);
        const by = cy + Math.sin(a) * (r * 0.55);
        const dx = Math.cos(a);
        const dy = Math.sin(a);

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + dx * bLen, by);
        ctx.moveTo(bx, by);
        ctx.lineTo(bx, by + dy * bLen);
        ctx.stroke();
      });
    };

    const frame = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      ctx.clearRect(0, 0, size, size);

      const speedMul = hovered ? 1.5 : 1;
      const isRec = state === "recording";

      // Rings
      drawRing(elapsed * speedMul, 140, 1.5, isRec ? 0.8 : 1, 20, 4, 30);
      drawRing(elapsed * speedMul, 160, 1, 0.5, -15, 6, 15);
      drawRing(elapsed * speedMul, 180, 0.5, 0.25, 10, 8, 10);

      // Waveform bars
      drawWaveformBars(elapsed, isRec);

      // Scan line
      drawScanLine(elapsed);

      // Corner brackets
      drawCornerBrackets();

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, hovered]);

  const isRec = state === "recording";
  const isProc = state === "processing";
  const orbBorder = isRec ? RED : GOLD;
  const orbBg = isRec
    ? "radial-gradient(circle, rgba(224,85,85,0.3) 0%, rgba(224,85,85,0.05) 100%)"
    : "radial-gradient(circle, rgba(240,165,0,0.3) 0%, rgba(240,165,0,0.05) 100%)";
  const orbShadow = isRec
    ? "0 0 30px rgba(224,85,85,0.4)"
    : "0 0 30px rgba(240,165,0,0.4)";

  const labelText = isRec ? "Listening..." : isProc ? processingLabels[labelIdx] : state === "playing" ? "Speaking..." : "Click to speak";
  const labelColor = isRec ? RED : "#8892A4";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative"
        style={{ width: 320, height: 320 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Canvas for rings, bars, scan, brackets */}
        <canvas
          ref={canvasRef}
          style={{ width: 320, height: 320, position: "absolute", inset: 0, pointerEvents: "none" }}
        />

        {/* HUD corner labels */}
        {corners.map((c) => {
          const a = (c.angle * Math.PI) / 180;
          const lx = 160 + Math.cos(a) * 115;
          const ly = 160 + Math.sin(a) * 115;
          return (
            <span
              key={c.label}
              className="absolute font-mono"
              style={{
                left: lx,
                top: ly,
                transform: `translate(${c.align === "right" ? "-100%" : "0"}, -50%)`,
                fontSize: 9,
                color: GOLD,
                opacity: 0.7,
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {c.dot && <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#00D68F", marginRight: 4, verticalAlign: "middle" }} />}
              {c.label}
            </span>
          );
        })}

        {/* Flash overlay */}
        {flash && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(240,165,0,0.5) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Center orb button */}
        <button
          onClick={handleClick}
          disabled={disabled || isProc || state === "playing"}
          className="absolute flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            border: `2px solid ${orbBorder}`,
            background: orbBg,
            boxShadow: orbShadow,
            cursor: disabled || isProc || state === "playing" ? "default" : "pointer",
            animation: state === "idle" ? "goldPulse 2s ease-in-out infinite" : "none",
            transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
          }}
        >
          {isProc ? (
            <div style={{ width: 24, height: 24, border: "2px solid rgba(240,165,0,0.3)", borderTopColor: GOLD, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </button>
      </div>

      <p style={{ color: labelColor, fontSize: 13, transition: "color 0.2s", minHeight: 20 }}>{labelText}</p>
    </div>
  );
};

export default HudVoiceButton;
