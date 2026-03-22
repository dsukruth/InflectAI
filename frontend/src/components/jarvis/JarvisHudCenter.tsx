import { useState, useCallback, useEffect, useRef } from "react";
import useVoiceRecorder from "@/hooks/useVoiceRecorder";
import { useInflectToast } from "@/components/ui/InflectToast";
import { transcribeAudio } from "@/api/query";
import type { VoiceState } from "@/components/voice/VoiceButton";

interface JarvisHudCenterProps {
  onTranscript: (text: string, confidence: number) => void;
  onStateChange: (state: VoiceState) => void;
  disabled?: boolean;
}

const GOLD = "#F0A500";
const RED = "#E05555";

const HudCorner = ({ position }: { position: "tl" | "tr" | "bl" | "br" }) => {
  const style: React.CSSProperties = {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "rgba(240,165,0,0.4)",
    borderWidth: 0,
    ...(position === "tl" && { top: 0, left: 0, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderTopStyle: "solid", borderLeftStyle: "solid" }),
    ...(position === "tr" && { top: 0, right: 0, borderTopWidth: 1.5, borderRightWidth: 1.5, borderTopStyle: "solid", borderRightStyle: "solid" }),
    ...(position === "bl" && { bottom: 0, left: 0, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderBottomStyle: "solid", borderLeftStyle: "solid" }),
    ...(position === "br" && { bottom: 0, right: 0, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderBottomStyle: "solid", borderRightStyle: "solid" }),
  };
  return <div style={style} />;
};

const JarvisHudCenter = ({ onTranscript, onStateChange, disabled = false }: JarvisHudCenterProps) => {
  const [state, setState] = useState<VoiceState>("idle");
  const { startRecording, stopRecording, audioBlob, isRecording, audioLevel } = useVoiceRecorder();
  const { showToast } = useInflectToast();
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => { onStateChange(state); }, [state, onStateChange]);

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
      const granted = await startRecording();
      if (!granted) { showToast("Microphone access denied.", "error"); return; }
      setState("recording");
    } else if (state === "recording") {
      stopRecording();
      setState("processing");
    }
  }, [state, disabled, startRecording, stopRecording, showToast]);

  // Spacebar shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        handleClick();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClick]);

  // Waveform bars canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const size = 200;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    const cx = size / 2;
    const cy = size / 2;
    const offsets = Array.from({ length: 24 }, () => Math.random() * Math.PI * 2);
    const startT = performance.now();

    const frame = (now: number) => {
      const t = (now - startT) / 1000;
      ctx.clearRect(0, 0, size, size);

      // Draw 24 waveform bars
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
        const isRec = state === "recording";
        const barH = isRec
          ? 4 + 12 * Math.abs(Math.sin(t * 3 + offsets[i]))
          : 4 + 6 * Math.abs(Math.sin(t * 1.2 + offsets[i]));
        const r1 = 56;
        const x1 = cx + Math.cos(angle) * r1;
        const y1 = cy + Math.sin(angle) * r1;
        const x2 = cx + Math.cos(angle) * (r1 + barH);
        const y2 = cy + Math.sin(angle) * (r1 + barH);
        ctx.strokeStyle = isRec ? "rgba(224,85,85,0.5)" : "rgba(240,165,0,0.5)";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state]);

  const isRec = state === "recording";
  const isProc = state === "processing";
  const isPlaying = state === "playing";

  const statusDot = isRec ? RED : isProc ? GOLD : isPlaying ? "#00C8FF" : "#00D68F";
  const statusText = isRec ? "LISTENING" : isProc ? "ANALYZING" : isPlaying ? "SPEAKING" : "READY";
  const shouldPulse = isRec || isProc || isPlaying;

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ background: "rgba(8,12,20,0.9)", minHeight: 320, overflow: "hidden" }}
    >
      <HudCorner position="tl" />
      <HudCorner position="tr" />
      <HudCorner position="bl" />
      <HudCorner position="br" />

      {/* Top label */}
      <span
        style={{
          position: "absolute",
          top: 12,
          left: 16,
          color: "rgba(240,165,0,0.3)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.2em",
        }}
      >
        // VOICE INTERFACE v2.0
      </span>

      {/* HUD Orb */}
      <div className="relative" style={{ width: 200, height: 200 }}>
        {/* SVG Rings */}
        <svg
          viewBox="0 0 200 200"
          style={{ position: "absolute", inset: 0, width: 200, height: 200 }}
        >
          {/* Ring 1 */}
          <circle
            cx="100" cy="100" r="88"
            fill="none"
            stroke={GOLD}
            strokeWidth="1.5"
            strokeDasharray="60 20"
            style={{ animation: "jarvisRingSpin1 18s linear infinite" }}
            transform-origin="100 100"
          />
          {/* Ring 2 */}
          <circle
            cx="100" cy="100" r="76"
            fill="none"
            stroke="rgba(240,165,0,0.4)"
            strokeWidth="1"
            strokeDasharray="40 15"
            style={{ animation: "jarvisRingSpin2 30s linear infinite" }}
            transform-origin="100 100"
          />
          {/* Ring 3 */}
          <circle
            cx="100" cy="100" r="64"
            fill="none"
            stroke="rgba(240,165,0,0.2)"
            strokeWidth="0.5"
            strokeDasharray="30 10"
            style={{ animation: "jarvisRingSpin3 45s linear infinite" }}
            transform-origin="100 100"
          />
        </svg>

        {/* Waveform canvas */}
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: 200, height: 200, pointerEvents: "none" }}
        />

        {/* Center mic button */}
        <button
          onClick={handleClick}
          disabled={disabled || isProc || isPlaying}
          className="absolute flex items-center justify-center"
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            border: `1.5px solid ${isRec ? RED : GOLD}`,
            background: isRec
              ? "radial-gradient(circle, rgba(224,85,85,0.2) 0%, rgba(224,85,85,0.05) 100%)"
              : "radial-gradient(circle, rgba(240,165,0,0.2) 0%, rgba(240,165,0,0.05) 100%)",
            boxShadow: isRec
              ? "0 0 30px rgba(224,85,85,0.5)"
              : "0 0 20px rgba(240,165,0,0.3)",
            cursor: disabled || isProc || isPlaying ? "default" : "pointer",
            animation: state === "idle" ? "orbPulse 2s infinite" : "none",
            transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
          }}
        >
          {isProc ? (
            <div style={{ width: 24, height: 24, border: "2px solid rgba(240,165,0,0.3)", borderTopColor: GOLD, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mt-4">
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: statusDot,
            boxShadow: shouldPulse ? `0 0 8px ${statusDot}` : "none",
            animation: shouldPulse ? "statusPulse 1.5s infinite" : "none",
          }}
        />
        <span style={{ color: statusDot, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.2em" }}>
          {statusText}
        </span>
      </div>

      {/* Spacebar hint */}
      <span style={{ color: "#1E2D40", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, marginTop: 8 }}>
        [ SPACE ] to activate
      </span>
    </div>
  );
};

export default JarvisHudCenter;
