import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import ModeToggle from "@/components/ui/ModeToggle";
import OutputPanel from "./OutputPanel";
import ChatThread from "@/components/chat/ChatThread";
import ChatInput from "@/components/chat/ChatInput";
import type { ChatMessage } from "@/components/chat/ChatThread";
import type { ThesisResult } from "@/types/api";

interface ChatModeProps {
  mode: "voice" | "chat";
  onModeChange: (mode: "voice" | "chat") => void;
  onSubmit: (text: string) => Promise<string>;
  messages: ChatMessage[];
  onNewMessage: (userMsg: ChatMessage, assistantMsg: ChatMessage) => void;
  onGenerateThesis: (ticker: string) => Promise<ThesisResult | null>;
  onUpdateMessage: (id: string, update: Partial<ChatMessage>) => void;
}

const ChatMode = ({ mode, onModeChange, onSubmit, messages, onNewMessage, onGenerateThesis, onUpdateMessage }: ChatModeProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [latestResponse, setLatestResponse] = useState<string | null>(null);

  const handleChipClick = useCallback((text: string) => {
    handleSubmit(text);
  }, []);

  const handleSubmit = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      setIsLoading(true);

      try {
        const response = await onSubmit(text);
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          timestamp: new Date().toISOString(),
        };
        onNewMessage(userMsg, assistantMsg);
        setLatestResponse(response);
      } catch {
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Something went wrong. Try again.",
          timestamp: new Date().toISOString(),
        };
        onNewMessage(userMsg, errMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [onSubmit, onNewMessage]
  );

  return (
    <motion.div
      className="flex flex-col"
      style={{ height: "calc(100vh - 104px)" }}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div className="flex justify-end px-8 py-3 shrink-0">
        <ModeToggle activeMode={mode} onChange={onModeChange} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col" style={{ width: "60%" }}>
          <ChatThread messages={messages} isLoading={isLoading} />
          <ChatInput onSubmit={handleSubmit} disabled={isLoading} />
        </div>

        <div style={{ width: "40%", borderLeft: "1px solid #1E2D40" }}>
          <OutputPanel content={latestResponse} onChipClick={handleChipClick} />
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMode;
