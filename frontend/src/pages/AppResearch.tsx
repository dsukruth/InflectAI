import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { analyzeQuery, transcribeAudio } from "@/api/query";
import { getChartData } from "@/api/chart";
import { getQuote, getMarketHistory, getMetricCard } from "@/api/market";
import { executeTrade as executeTradeApi } from "@/api/trades";
import useVoiceRecorder from "@/hooks/useVoiceRecorder";
import { useInflectToast } from "@/components/ui/InflectToast";
import TradeModal from "@/components/trading/TradeModal";
import ResearchPromptBar from "@/components/research/ResearchPromptBar";
import ResearchVisualizationsPanel from "@/components/research/ResearchVisualizationsPanel";
import ChatMessage, { type ChatMsg } from "@/components/research/ChatMessage";
import VoiceOverlay from "@/components/research/VoiceOverlay";
import { EXAMPLE_QUERIES } from "@/utils/constants";
import type { AnswerResult, ThesisResult, TradeOrder, StockQuote, Query, ResearchMetricData } from "@/types/api";
import type { AnalyzeResult } from "@/api/query";
import type { VoiceState } from "@/components/voice/VoiceButton";

const USE_BACKEND = true;

const mockAnalyze = (text: string): AnalyzeResult => {
  const lower = text.toLowerCase();
  const isPriceCheck = /what('s| is).*trading|price of|quote/i.test(lower);
  const ticker = text.match(/\b[A-Z]{1,5}\b/)?.[0] || null;
  const isMetric = /margin|revenue|earnings|eps|ratio|growth/i.test(lower);
  const isTrade = /\b(buy|sell|purchase|dump)\b/i.test(lower);
  return {
    intent_type: isTrade ? "trade" : isPriceCheck ? "price_check" : "research",
    ticker,
    metric: isMetric ? (lower.includes("margin") ? "Gross Margin" : "Revenue") : null,
    timeframe: null,
    confidence: 0.92,
    answer: `Offline demo answer for "${text.slice(0, 80)}${text.length > 80 ? "…" : ""}" — set VITE_API_URL and ensure /api/v1/query/analyze succeeds.`,
    source: isPriceCheck ? "MARKET_DATA" : isMetric ? "SEC_FILING" : "LLM",
    citation: isMetric ? `${ticker || "AAPL"} 10-K · Filed Nov 3 2023 · Item 7` : null,
    confidence_level: "HIGH",
  };
};

const mockQuote = (ticker: string): StockQuote => ({
  ticker, price: 189.5, change_percent: 2.4, volume: 52_300_000, direction: "up", timestamp: new Date().toISOString(),
});

const mockThesis = (ticker: string): ThesisResult => ({
  ticker,
  fundamental: { signal: "BULLISH", reason: "Strong revenue growth of 122% YoY driven by data center demand.", citation: `${ticker} 10-K · Filed Feb 2024` },
  technical: { signal: "BULLISH", reason: "Price above 50-day and 200-day moving averages with strong momentum.", rsi: 62 },
  sentiment: { signal: "POSITIVE", reason: "Overwhelmingly positive analyst coverage and institutional buying.", score: 0.87 },
  verdict: "HOLD",
  confidence: "HIGH",
});

function speakText(text: string, onStart?: () => void, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.0; u.pitch = 1.0;
  u.onstart = () => onStart?.();
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

const detectTradeIntent = (text: string) => {
  const lower = text.toLowerCase();
  const buyMatch = /\b(buy|purchase|get)\b/i.test(lower);
  const sellMatch = /\b(sell|dump|exit)\b/i.test(lower);
  if (!buyMatch && !sellMatch) return null;
  const ticker = text.match(/\b([A-Z]{1,5})\b/)?.[1] || null;
  const qtyMatch = text.match(/(\d+)\s*(shares?|stocks?)?/i);
  const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : null;
  return { side: (buyMatch ? "buy" : "sell") as "buy" | "sell", ticker, quantity };
};

const AppResearch = () => {
  const { user } = useAuthStore();
  const { ticker: sessionTicker, timeframe: sessionTimeframe, setTicker, addAnswer, sessionId } = useSessionStore();
  const { buyingPower, setBuyingPower, setTotalValue } = usePortfolioStore();
  const { showToast } = useInflectToast();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [pendingOrder, setPendingOrder] = useState<TradeOrder | null>(null);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [fillResult, setFillResult] = useState<{ fill_price: number } | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceProcessingPhase, setVoiceProcessingPhase] = useState<"transcribe" | "analyze">("transcribe");

  // Right panel state
  const [answerData, setAnswerData] = useState<AnswerResult | null>(null);
  const [stockQuote, setStockQuote] = useState<StockQuote | null>(null);
  const [metricData, setMetricData] = useState<ResearchMetricData | null>(null);
  const [thesisData, setThesisData] = useState<ThesisResult | null>(null);
  const [thesisLoading, setThesisLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const { startRecording, stopRecording, audioBlob, isRecording, audioLevel } = useVoiceRecorder();

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("buying_power").eq("id", user.id).single();
      if (data) { setBuyingPower(data.buying_power); setTotalValue(data.buying_power); }
    })();
  }, [user, setBuyingPower, setTotalValue]);

  // Silence detection
  useEffect(() => {
    if (!isRecording) return;
    if (audioLevel < 0.02) {
      const timer = setTimeout(() => {
        stopRecording();
        setVoiceProcessingPhase("transcribe");
        setVoiceState("processing");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [audioLevel, isRecording, stopRecording]);

  const handleMicClick = useCallback(async () => {
    if (voiceState === "idle") {
      const granted = await startRecording();
      if (!granted) { showToast("Microphone access denied", "error"); return; }
      setVoiceProcessingPhase("transcribe");
      setVoiceState("recording");
    } else if (voiceState === "recording") {
      stopRecording();
      setVoiceProcessingPhase("transcribe");
      setVoiceState("processing");
    }
  }, [voiceState, startRecording, stopRecording, showToast]);

  const handleVoiceCancel = useCallback(() => {
    if (isRecording) stopRecording();
    setVoiceProcessingPhase("transcribe");
    setVoiceState("idle");
  }, [isRecording, stopRecording]);

  const runPipeline = useCallback(async (text: string) => {
    let result: AnalyzeResult;
    try {
      result = USE_BACKEND ? await analyzeQuery(text, { ticker: sessionTicker, timeframe: sessionTimeframe }) : mockAnalyze(text);
    } catch (e) {
      /* Do not silently fall back to mock when the real API is enabled — that produced a confusing "Wire up backend" message. */
      if (USE_BACKEND) {
        throw e instanceof Error ? e : new Error(String(e));
      }
      result = mockAnalyze(text);
    }

    if (result.ticker) setTicker(result.ticker);

    let quote: StockQuote | null = null;
    let metric: ResearchMetricData | null = null;

    if (result.intent_type === "price_check" && result.ticker) {
      try {
        if (USE_BACKEND) {
          const t = result.ticker;
          const [q, hist] = await Promise.all([
            getQuote(t),
            getMarketHistory(t, "30d").catch(() => null),
          ]);
          quote = hist?.sparkline?.length ? { ...q, sparkline: hist.sparkline } : q;
        } else {
          quote = mockQuote(result.ticker);
        }
      } catch {
        quote = mockQuote(result.ticker);
      }
    }

    const metricTicker = result.ticker || sessionTicker;
    if (result.metric && metricTicker) {
      try {
        if (USE_BACKEND) {
          const mc = await getMetricCard(metricTicker, result.metric);
          metric = {
            metric: mc.metric,
            value: mc.value,
            period: mc.period,
            change: mc.change ?? undefined,
            changeDirection: mc.change_direction ?? undefined,
            source: mc.source,
            citation: mc.citation,
          };
        } else {
          metric = {
            metric: result.metric,
            value: result.metric.includes("Margin") ? "44.1%" : "$394.3B",
            period: result.timeframe || "Q4 2023",
            change: "+0.8% YoY",
            changeDirection: "up",
            source: "SEC_FILING",
            citation: `${metricTicker} 10-K`,
          };
        }
      } catch {
        metric = {
          metric: result.metric,
          value: "—",
          period: result.timeframe || "TTM",
          source: "UNAVAILABLE",
          citation: null,
        };
      }
    } else if (result.metric) {
      metric = {
        metric: result.metric,
        value: "—",
        period: result.timeframe || "TTM",
        source: "UNAVAILABLE",
        citation: null,
      };
    }

    if (user) {
      const { error: logError } = await supabase.from("queries").insert({
        user_id: user.id,
        session_id: sessionId,
        transcript: text,
        intent_type: result.intent_type,
        response_text: result.answer,
        ticker: result.ticker,
        mode: "chat",
      });
      if (logError) {
        /* RLS/schema errors must not block the chat UI */
      }
    }

    const answerResult: AnswerResult = { answer: result.answer, intent_type: result.intent_type, ticker: result.ticker, confidence: result.confidence_level, source: result.source as AnswerResult["source"], citation: result.citation };
    addAnswer(answerResult);
    return { result, quote, metricData: metric, answerResult };
  }, [user, sessionTicker, sessionTimeframe, setTicker, addAnswer, sessionId, USE_BACKEND]);

  const submitQuery = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      showToast("Empty question — type or speak again", "error");
      return;
    }

    setChartData(null);

    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages(prev => [...prev, userMsg]);

    try {
      const { result, quote, metricData: md, answerResult } = await runPipeline(trimmed);

      setAnswerData(answerResult);
      setStockQuote(quote);
      setMetricData(md);

      const botMsg: ChatMsg = {
        id: crypto.randomUUID(),
        role: "bot",
        text: result.answer,
        answerData: answerResult,
        stockQuote: quote,
        metricData: md,
        onGenerateThesis: result.ticker ? () => handleGenerateThesis(result.ticker!) : undefined,
        onPlotTrend: result.ticker ? () => handlePlotTrend(result.ticker!) : undefined,
      };
      setMessages(prev => [...prev, botMsg]);

      if (result.intent_type === "trade") {
        const trade = detectTradeIntent(trimmed);
        if (trade?.ticker && trade?.quantity) {
          const estPrice = quote?.price || 189.5;
          setPendingOrder({
            ticker: trade.ticker,
            side: trade.side,
            quantity: trade.quantity,
            order_type: "market",
            estimated_price: estPrice,
            estimated_total: estPrice * trade.quantity,
          });
        }
      }

      const ttsText =
        result.intent_type === "price_check" && quote
          ? `${quote.ticker} is at $${quote.price.toFixed(2)}, ${quote.direction} ${Math.abs(quote.change_percent).toFixed(1)} percent`
          : result.answer.slice(0, 200);
      speakText(ttsText);
    } catch (err) {
      const desc = err instanceof Error ? err.message : "Something went wrong";
      showToast(desc, "error");
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: `Could not complete that request (${desc}). Check that the API is reachable (VITE_API_URL) and you are signed in if the backend requires auth.`,
        },
      ]);
    }
  }, [runPipeline, showToast]);

  // After submitQuery exists: transcribe when blob is ready in processing state
  useEffect(() => {
    if (!audioBlob || voiceState !== "processing") return;
    let cancelled = false;
    (async () => {
      try {
        const r = await transcribeAudio(audioBlob);
        if (cancelled) return;
        setVoiceProcessingPhase("analyze");
        await submitQuery(r.transcript);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Transcription failed";
          showToast(msg, "error");
        }
      } finally {
        if (!cancelled) setVoiceState("idle");
      }
    })();
    return () => { cancelled = true; };
  }, [audioBlob, voiceState, submitQuery, showToast]);

  const handleGenerateThesis = useCallback(async (ticker?: string) => {
    const t = ticker || answerData?.ticker;
    if (!t) return;
    setThesisLoading(true);
    try {
      if (USE_BACKEND) {
        const { apiCall } = await import("@/api/client");
        const result = await apiCall<ThesisResult>("/api/v1/thesis/generate", { method: "POST", body: JSON.stringify({ ticker: t }) });
        if (result) setThesisData(result);
      } else {
        await new Promise(r => setTimeout(r, 1500));
        setThesisData(mockThesis(t));
      }
    } catch { toast({ title: "Error", description: "Couldn't generate thesis", variant: "destructive" }); }
    finally { setThesisLoading(false); }
  }, [answerData]);

  const handlePlotTrend = useCallback(async (ticker?: string) => {
    const t = ticker || answerData?.ticker;
    if (!t) return;
    try {
      const data = await getChartData(t, metricData?.metric || null, null);
      if (data) setChartData(data);
    } catch { toast({ title: "Error", description: "Couldn't load chart data", variant: "destructive" }); }
  }, [answerData, metricData]);

  const handleTextSubmit = useCallback((text: string) => {
    if (!text.trim()) return;
    submitQuery(text);
  }, [submitQuery]);

  const handleTradeConfirm = useCallback(async () => {
    if (!pendingOrder || !user) return;
    if (fillResult) { setPendingOrder(null); setFillResult(null); setTradeLoading(false); return; }
    setTradeLoading(true);
    try {
      let fill: { fill_price: number; total_value: number };
      if (USE_BACKEND) { fill = await executeTradeApi({ ticker: pendingOrder.ticker, side: pendingOrder.side, quantity: pendingOrder.quantity, order_type: "market" }); }
      else { await new Promise(r => setTimeout(r, 1500)); const fp = pendingOrder.estimated_price * (1 + (Math.random() - 0.5) * 0.001); fill = { fill_price: fp, total_value: fp * pendingOrder.quantity }; }
      const newBP = pendingOrder.side === "buy" ? buyingPower - fill.total_value : buyingPower + fill.total_value;
      setBuyingPower(newBP);
      await supabase.from("trades").insert({ user_id: user.id, ticker: pendingOrder.ticker, side: pendingOrder.side, quantity: pendingOrder.quantity, fill_price: fill.fill_price, total_value: fill.total_value, status: "filled" });
      await supabase.from("profiles").update({ buying_power: newBP }).eq("id", user.id);
      setFillResult({ fill_price: fill.fill_price });
    } catch { setPendingOrder(null); setTradeLoading(false); toast({ title: "Error", description: "Order failed.", variant: "destructive" }); }
  }, [pendingOrder, user, fillResult, buyingPower, setBuyingPower]);

  const handleTradeCancel = useCallback(() => { setPendingOrder(null); setTradeLoading(false); setFillResult(null); }, []);

  return (
    <div className="flex" style={{ height: "calc(100vh - 144px)" }}>
      {/* Left column — conversation */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat thread */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="text-center">
                <h2 className="font-display" style={{ color: "hsl(var(--foreground))", fontSize: 22, fontWeight: 600, marginBottom: 6 }}>
                  Ask anything about the markets
                </h2>
                <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>
                  Query SEC filings, get price data, generate trade theses
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full" style={{ maxWidth: 420 }}>
                {EXAMPLE_QUERIES.map(q => (
                  <button
                    key={q}
                    onClick={() => handleTextSubmit(q)}
                    className="text-left px-4 py-3 rounded-xl transition-all duration-200"
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "hsl(var(--muted))",
                      color: "hsl(var(--muted-foreground))",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(55,138,221,0.4)";
                      e.currentTarget.style.color = "hsl(var(--foreground))";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map(msg => (
                <ChatMessage key={msg.id} msg={msg} />
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Voice overlay */}
        {voiceState !== "idle" && (
          <div className="px-6 pb-2">
            <VoiceOverlay
              voiceState={voiceState}
              processingPhase={voiceProcessingPhase}
              onCancel={handleVoiceCancel}
            />
          </div>
        )}

        {/* Input dock — pinned */}
        <div className="shrink-0 px-6 pb-4 pt-2">
          <ResearchPromptBar
            onSubmit={handleTextSubmit}
            onMicClick={handleMicClick}
            voiceState={voiceState}
            disabled={false}
          />
        </div>
      </div>

      {/* Right column — 340px visualizations */}
      <div className="shrink-0" style={{ width: 340 }}>
        <ResearchVisualizationsPanel
          answerData={answerData}
          stockQuote={stockQuote}
          metricData={metricData}
          thesisData={thesisData}
          thesisLoading={thesisLoading}
          chartData={chartData}
          chartTitle={metricData?.metric || "Price"}
          chartTicker={answerData?.ticker || sessionTicker || ""}
          onGenerateThesis={() => handleGenerateThesis()}
          onPlotTrend={() => handlePlotTrend()}
        />
      </div>

      <TradeModal order={pendingOrder} onConfirm={handleTradeConfirm} onCancel={handleTradeCancel} isLoading={tradeLoading} fillResult={fillResult} />
    </div>
  );
};

export default AppResearch;
