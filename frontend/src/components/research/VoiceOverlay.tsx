import type { VoiceState } from "@/components/voice/VoiceButton";

export type VoiceProcessingPhase = "transcribe" | "analyze";

interface VoiceOverlayProps {
  voiceState: VoiceState;
  /** While `processing`: STT vs query/analyze pipeline (matches E2E test steps). */
  processingPhase?: VoiceProcessingPhase;
  onCancel: () => void;
}

const stageLabels = ["Listening...", "Transcribing...", "Analyzing...", "Speaking..."];

const getActiveStage = (state: VoiceState, processingPhase: VoiceProcessingPhase) => {
  if (state === "recording") return 0;
  if (state === "processing") return processingPhase === "analyze" ? 2 : 1;
  if (state === "playing") return 3;
  return -1;
};

const VoiceOverlay = ({ voiceState, onCancel, processingPhase = "transcribe" }: VoiceOverlayProps) => {
  if (voiceState === "idle") return null;
  const active = getActiveStage(voiceState, processingPhase);
  const ringColor =
    voiceState === "recording" ? "#E05555" :
    voiceState === "processing" ? "#F0A500" :
    voiceState === "playing" ? "#00D68F" : "#378ADD";

  return (
    <div
      className="flex flex-col items-center gap-4 py-6 px-4 rounded-2xl"
      style={{
        background: "rgba(12,18,28,0.9)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        animation: "bubbleIn 200ms ease-out",
      }}
    >
      {/* Pulsing ring */}
      <div
        className="flex items-center justify-center"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: `3px solid ${ringColor}`,
          boxShadow: `0 0 24px ${ringColor}60`,
          animation: voiceState === "recording" ? "goldPulse 1.5s ease-in-out infinite" : "none",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ringColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </div>

      {/* Waveform bars */}
      <div className="flex items-center gap-1" style={{ height: 24 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 3,
              borderRadius: 2,
              background: ringColor,
              opacity: 0.6,
              animation: voiceState === "recording" ? `barPulse 0.8s ease-in-out ${i * 0.08}s infinite` : "none",
              height: voiceState === "recording" ? undefined : 6,
            }}
          />
        ))}
      </div>

      {/* Status text */}
      <p className="font-mono" style={{ color: ringColor, fontSize: 12 }}>
        {stageLabels[active] || "Processing..."}
      </p>

      {/* Stage pills */}
      <div className="flex gap-2">
        {stageLabels.map((label, i) => (
          <span
            key={label}
            className="font-mono"
            style={{
              fontSize: 9,
              padding: "2px 8px",
              borderRadius: 8,
              background: i <= active ? `${ringColor}20` : "rgba(255,255,255,0.04)",
              color: i <= active ? ringColor : "hsl(var(--muted-foreground))",
              border: `1px solid ${i <= active ? `${ringColor}40` : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {label.replace("...", "")}
          </span>
        ))}
      </div>

      <button
        onClick={onCancel}
        className="font-mono"
        style={{ color: "hsl(var(--muted-foreground))", fontSize: 12, background: "none", border: "none", cursor: "pointer", marginTop: 4 }}
      >
        Cancel
      </button>
    </div>
  );
};

export default VoiceOverlay;
