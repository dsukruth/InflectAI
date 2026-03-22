export interface Profile {
  id: string;
  email: string;
  buying_power: number;
  default_mode: 'voice' | 'chat';
  queries_today: number;
  created_at: string;
}

export interface Position {
  id: string;
  user_id: string;
  ticker: string;
  quantity: number;
  avg_cost_basis: number;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  ticker: string;
  side: 'buy' | 'sell';
  quantity: number;
  fill_price: number;
  total_value: number;
  status: string;
  created_at: string;
}

export interface Query {
  id: string;
  user_id: string;
  session_id: string;
  transcript: string;
  intent_type: string;
  response_text: string;
  ticker: string | null;
  mode: 'voice' | 'chat';
  created_at: string;
}

export interface AnswerResult {
  answer: string;
  intent_type: string;
  ticker: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  source: 'SEC_FILING' | 'WOLFRAM' | 'MARKET_DATA' | 'LLM';
  citation: string | null;
}

export interface StockQuote {
  ticker: string;
  price: number;
  change_percent: number;
  volume: number;
  direction: 'up' | 'down';
  timestamp: string;
  sparkline?: { v: number }[];
}

export interface ResearchMetricData {
  metric: string;
  value: string;
  period: string;
  change?: string;
  changeDirection?: 'up' | 'down';
  source?: string;
  citation?: string | null;
}

export interface ThesisResult {
  ticker: string;
  fundamental: {
    signal: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    reason: string;
    citation: string;
  };
  technical: {
    signal: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    reason: string;
    rsi: number | null;
  };
  sentiment: {
    signal: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    reason: string;
    score: number;
  };
  verdict: 'HOLD' | 'WATCH' | 'AVOID';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TradeOrder {
  ticker: string;
  side: 'buy' | 'sell';
  quantity: number;
  order_type: 'market';
  estimated_price: number;
  estimated_total: number;
}
