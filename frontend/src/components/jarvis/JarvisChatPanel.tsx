import ChatThread from "@/components/chat/ChatThread";
import ChatInput from "@/components/chat/ChatInput";
import type { ChatMessage } from "@/components/chat/ChatThread";

interface JarvisChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSubmit: (text: string) => void;
}

const HudCorner = ({ position }: { position: "tl" | "tr" | "bl" | "br" }) => {
  const style: React.CSSProperties = {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "rgba(240,165,0,0.4)",
    borderWidth: 0,
    zIndex: 2,
    ...(position === "tl" && { top: 0, left: 0, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderTopStyle: "solid", borderLeftStyle: "solid" }),
    ...(position === "tr" && { top: 0, right: 0, borderTopWidth: 1.5, borderRightWidth: 1.5, borderTopStyle: "solid", borderRightStyle: "solid" }),
    ...(position === "bl" && { bottom: 0, left: 0, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderBottomStyle: "solid", borderLeftStyle: "solid" }),
    ...(position === "br" && { bottom: 0, right: 0, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderBottomStyle: "solid", borderRightStyle: "solid" }),
  };
  return <div style={style} />;
};

const JarvisChatPanel = ({ messages, isLoading, onSubmit }: JarvisChatPanelProps) => {
  return (
    <div className="relative flex flex-col h-full" style={{ background: "rgba(8,12,20,0.9)", minHeight: 0 }}>
      <HudCorner position="tl" />
      <HudCorner position="tr" />
      <HudCorner position="bl" />
      <HudCorner position="br" />

      <span
        style={{
          position: "absolute",
          top: 12,
          left: 16,
          color: "rgba(240,165,0,0.3)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.2em",
          zIndex: 2,
        }}
      >
        // CHAT INTERFACE v2.0
      </span>

      <div className="flex-1 overflow-hidden" style={{ paddingTop: 32 }}>
        <ChatThread messages={messages} isLoading={isLoading} />
      </div>
      <ChatInput onSubmit={onSubmit} disabled={isLoading} placeholder="Type your query..." />
    </div>
  );
};

export default JarvisChatPanel;
