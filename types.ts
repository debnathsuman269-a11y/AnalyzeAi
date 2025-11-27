export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface TradeLevel {
  type: 'Intraday' | 'Swing' | 'Delivery';
  action: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  entry: string;
  target: string;
  stopLoss: string;
  winProbability: string;
  reasoning: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface StockAnalysisData {
  stockName: string;
  currentPrice: string;
  fundamentals: string;
  technicals: string;
  news: string;
  tradeLevels: TradeLevel[];
  sources: GroundingSource[];
  rawText: string; // Fallback
}

export interface EarningsResult {
  symbol: string;
  name: string;
  expectation: string;
}

export interface MarketMover {
  symbol: string;
  price: string;
  change: string; // e.g. "+5.4%"
}

export interface MarketData {
  gainers: MarketMover[];
  losers: MarketMover[];
  breakouts: MarketMover[];
}