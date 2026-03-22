import { useState, useRef, useCallback } from "react";
import type { VoiceState } from "@/components/voice/VoiceButton";

interface ResearchPromptBarProps {
  onSubmit: (text: string) => void;
  onMicClick: () => void;
  voiceState: VoiceState;
  disabled?: boolean;
}

const ResearchPromptBar = ({ onSubmit, onMicClick, voiceState, disabled }: ResearchPromptBarProps) => {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSubmit = value.trim().length > 0 && !disabled;
  const isRecording = voiceState === "recording";
  const isProcessing = voiceState === "processing";

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit(value.trim());
    setValue("");
  }, [canSubmit, value, onSubmit]);

  return (
    <div
      className="flex items-center gap-2"
      style={{
        height: 48,
        borderRadius: 24,
        padding: "0 6px 0 16px",
        background: focused ? "hsl(var(--card))" : "hsl(var(--muted))",
        border: focused ? "1.5px solid #378ADD" : "1.5px solid transparent",
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      {/* Text input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Ask anything about the markets..."
        disabled={disabled}
        className="flex-1 focus:outline-none bg-transparent"
        style={{ color: "hsl(var(--foreground))", fontSize: 14, border: "none" }}
      />

      {/* Mic button */}
      <button
        onClick={onMicClick}
        disabled={isProcessing}
        className="shrink-0 flex items-center justify-center transition-all duration-200"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: isRecording ? "rgba(224,85,85,0.15)" : "transparent",
          cursor: isProcessing ? "default" : "pointer",
        }}
      >
        {isProcessing ? (
          <div style={{ width: 14, height: 14, border: "2px solid rgba(0,212,255,0.3)", borderTopColor: "hsl(var(--cyan))", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isRecording ? "#E05555" : "hsl(var(--muted-foreground))"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        )}
      </button>

      {/* Send button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="shrink-0 flex items-center justify-center transition-all duration-200"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: canSubmit ? "#378ADD" : "transparent",
          cursor: canSubmit ? "pointer" : "default",
          opacity: canSubmit ? 1 : 0.3,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={canSubmit ? "white" : "hsl(var(--muted-foreground))"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
};

export default ResearchPromptBar;
