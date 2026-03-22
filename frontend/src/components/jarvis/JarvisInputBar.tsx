import { useState, useRef, useCallback } from "react";

interface JarvisInputBarProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

const JarvisInputBar = ({ onSubmit, disabled }: JarvisInputBarProps) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const canSubmit = value.trim().length > 0 && !disabled;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit(value.trim());
    setValue("");
  }, [canSubmit, value, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="flex items-center gap-3"
      style={{
        height: 56,
        background: "rgba(8,12,20,0.95)",
        padding: "8px 16px",
        borderTop: "1px solid rgba(240,165,0,0.08)",
      }}
    >
      <span style={{ color: "#F0A500", fontFamily: "'JetBrains Mono', monospace", fontSize: 14, flexShrink: 0 }}>
        &gt;
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter query or speak..."
        className="flex-1 focus:outline-none"
        style={{
          background: "transparent",
          border: "none",
          color: "white",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="flex items-center justify-center shrink-0 transition-colors duration-150"
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: canSubmit ? "rgba(240,165,0,0.1)" : "rgba(240,165,0,0.05)",
          border: "1px solid rgba(240,165,0,0.3)",
          cursor: canSubmit ? "pointer" : "default",
          opacity: canSubmit ? 1 : 0.4,
        }}
        onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.background = "rgba(240,165,0,0.2)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = canSubmit ? "rgba(240,165,0,0.1)" : "rgba(240,165,0,0.05)"; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
};

export default JarvisInputBar;
