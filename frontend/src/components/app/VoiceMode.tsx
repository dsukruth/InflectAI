import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import ModeToggle from "@/components/ui/ModeToggle";
import OutputPanel from "./OutputPanel";
import HudVoiceButton from "@/components/voice/HudVoiceButton";
import QueryHistory from "@/components/research/QueryHistory";
import type { VoiceState } from "@/components/voice/VoiceButton";
import type { AnswerResult, StockQuote, ThesisResult, Query } from "@/types/api";
import type { ChartData } from "@/api/chart";

interface VoiceSubmitResult {
  answerData: AnswerResult;
  stockQuote?: StockQuote | null;
  metricData?: { metric: string; value: string; period: string; change?: string; changeDirection?: "up" | "down" } | null;
}

interface VoiceModeProps {
  mode: "voice" | "chat";
  onModeChange: (mode: "voice" | "chat") => void;
  queries: Query[];
  onSubmit: (text: string) => Promise<VoiceSubmitResult | void>;
  onGenerateThesis: (ticker: string) => Promise<ThesisResult | null>;
  onPlotTrend: (ticker: string, metric: string | null) => Promise<ChartData | null>;
  onClearQueries?: () => void;
  voiceStateOverride?: "idle" | "playing" | null;
}

const VoiceMode = ({ mode, onModeChange, queries, onSubmit, onGenerateThesis, onPlotTrend, onClearQueries, voiceStateOverride }: VoiceModeProps) => {
  const [textInput, setTextInput] = useState("");
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);
  const [answerData, setAnswerData] = useState<AnswerResult | null>(null);
  const [stockQuote, setStockQuote] = useState<StockQuote | null>(null);
  const [metricData, setMetricData] = useState<{ metric: string; value: string; period: string; change?: string; changeDirection?: "up" | "down" } | null>(null);
  const [thesisData, setThesisData] = useState<ThesisResult | null>(null);
  const [thesisLoading, setThesisLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  const submitQuery = async (text: string) => {
    setThesisData(null);
    setThesisLoading(false);
    setChartData(null);
    setActiveQueryId(null);
    const result = await onSubmit(text);
    if (result) {
      setAnswerData(result.answerData);
      setStockQuote(result.stockQuote || null);
      setMetricData(result.metricData || null);
      setSelectedOutput(null);
    }
  };

  const handleGenerateThesis = useCallback(async () => {
    const ticker = answerData?.ticker;
    if (!ticker) return;
    setThesisLoading(true);
    try {
      const result = await onGenerateThesis(ticker);
      if (result) setThesisData(result);
    } finally {
      setThesisLoading(false);
    }
  }, [answerData, onGenerateThesis]);

  const handlePlotTrend = useCallback(async () => {
    const ticker = answerData?.ticker;
    if (!ticker) return;
    const metric = metricData?.metric || null;
    const data = await onPlotTrend(ticker, metric);
    if (data) setChartData(data);
  }, [answerData, metricData, onPlotTrend]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const text = textInput.trim();
    setTextInput("");
    await submitQuery(text);
  };

  const handleChipClick = (text: string) => setTextInput(text);

  const handleQuerySelect = useCallback((query: Query) => {
    setActiveQueryId(query.id);
    setSelectedOutput(query.response_text || "No response available.");
    setAnswerData(null);
    setThesisData(null);
    setChartData(null);
  }, []);

  const handleTranscript = useCallback(
    (text: string, confidence: number) => {
      if (confidence >= 0.8) {
        setTextInput(text);
        submitQuery(text);
      } else {
        setTextInput(text);
      }
    },
    [onSubmit]
  );

  const handleStateChange = useCallback((state: VoiceState) => {
    setVoiceState(state);
  }, []);

  return (
    <motion.div
      className="flex"
      style={{ height: "calc(100vh - 104px)" }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Left: Query History */}
      <div
        className="shrink-0"
        style={{
          width: "20%",
          minWidth: 200,
          borderRight: "1px solid #1E2D40",
        }}
      >
        <QueryHistory
          queries={queries}
          onSelect={handleQuerySelect}
          activeQueryId={activeQueryId}
          onClear={onClearQueries}
        />
      </div>

      {/* Center: Voice area */}
      <div className="flex flex-col items-center justify-center gap-6" style={{ width: "40%" }}>
        <ModeToggle activeMode={mode} onChange={onModeChange} />
        <HudVoiceButton onTranscript={handleTranscript} onStateChange={handleStateChange} disabled={false} />
        <form onSubmit={handleTextSubmit} style={{ maxWidth: 280, width: "100%" }}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Or type here..."
            className="w-full focus:outline-none transition-colors duration-200"
            style={{
              background: "rgba(15,24,32,0.8)",
              border: "1px solid #1E2D40",
              borderRadius: 8,
              padding: "10px 14px",
              color: "white",
              fontSize: 13,
            }}
            onFocus={(e) => (e.target.style.borderColor = "#F0A500")}
            onBlur={(e) => (e.target.style.borderColor = "#1E2D40")}
          />
        </form>
      </div>

      {/* Right: Output */}
      <div style={{ width: "40%", borderLeft: "1px solid #1E2D40" }}>
        <OutputPanel
          content={selectedOutput}
          answerData={answerData}
          stockQuote={stockQuote}
          metricData={metricData}
          thesisData={thesisData}
          thesisLoading={thesisLoading}
          chartData={chartData}
          chartTitle={metricData?.metric || "Price"}
          chartTicker={answerData?.ticker || undefined}
          onChipClick={handleChipClick}
          onGenerateThesis={handleGenerateThesis}
          onPlotTrend={handlePlotTrend}
        />
      </div>
    </motion.div>
  );
};

export default VoiceMode;
