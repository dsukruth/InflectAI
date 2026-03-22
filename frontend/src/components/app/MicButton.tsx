import { useState, useEffect } from "react";

type VoiceState = "idle" | "recording" | "processing";

interface MicButtonProps {
  state: VoiceState;
  onToggle: () => void;
}

const processingLabels = ["Transcribing...", "Analyzing...", "Generating...", "Speaking..."];

const MicButton = ({ state, onToggle }: MicButtonProps) => {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    if (state !== "processing") {
      setLabelIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLabelIndex((i) => (i + 1) % processingLabels.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={onToggle}
        className="w-20 h-20 rounded-full flex items-center justify-center transition-all relative"
        style={
          state === "recording"
            ? { background: "rgba(224,85,85,0.2)", border: "2px solid #E05555" }
            : state === "processing"
            ? { background: "rgba(240,165,0,0.15)", border: "2px solid #F0A500" }
            : {
                background: "radial-gradient(circle, rgba(240,165,0,0.2), rgba(240,165,0,0.05))",
                border: "2px solid #F0A500",
                animation: "pulse-glow 2s ease-in-out infinite",
              }
        }
      >
        {state === "processing" ? (
          <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        )}
      </button>

      {state === "recording" && (
        <div className="flex items-end gap-1 h-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 rounded-full"
              style={{
                background: "#F0A500",
                animation: `waveform 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground h-4">
        {state === "recording"
          ? "Listening..."
          : state === "processing"
          ? processingLabels[labelIndex]
          : ""}
      </p>
    </div>
  );
};

export default MicButton;
