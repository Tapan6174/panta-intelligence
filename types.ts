
export interface TokenSummary {
  id: string;
  symbol: string;
  name: string;
  image: string;
}

export interface TokenMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  // Fix: Added market_cap_rank to reflect CoinGecko API response and fix the property error in App.tsx line 180
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
}

export interface HistoricalPoint {
  time: number;
  value: number;
}

export interface TokenHistory {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface DashboardData {
  summary: TokenMarketData;
  history: TokenHistory;
  derived: {
    fdvGap: number;
    supplyUtilization: number;
    athDistance: number;
  };
}