interface ModeToggleProps {
  mode: "voice" | "chat";
  onChange: (mode: "voice" | "chat") => void;
}

const ModeToggle = ({ mode, onChange }: ModeToggleProps) => {
  const activeStyle = { background: "#F0A500", color: "#080C14" };
  const inactiveStyle = { background: "transparent", color: "#F0A500", border: "1px solid #F0A500" };

  return (
    <div className="flex rounded-full overflow-hidden" style={{ border: "1px solid #F0A500" }}>
      <button
        onClick={() => onChange("voice")}
        className="px-4 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5"
        style={mode === "voice" ? activeStyle : { ...inactiveStyle, border: "none" }}
      >
        🎙️ Voice
      </button>
      <button
        onClick={() => onChange("chat")}
        className="px-4 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5"
        style={mode === "chat" ? activeStyle : { ...inactiveStyle, border: "none" }}
      >
        💬 Chat
      </button>
    </div>
  );
};

export default ModeToggle;
