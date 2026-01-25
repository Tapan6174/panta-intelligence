
import { TokenMarketData, TokenHistory, TokenSummary } from '../types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Cache mechanism
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 60000; // 60 seconds

async function fetchWithCache(url: string) {
  const now = Date.now();
  if (cache[url] && now - cache[url].timestamp < CACHE_TTL) {
    return cache[url].data;
  }

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 429) {
        throw new Error("Rate limit exceeded. CoinGecko free tier allows 10-30 calls/min.");
    }
    throw new Error(`Failed to fetch from CoinGecko: ${response.statusText}`);
  }

  const data = await response.json();
  cache[url] = { data, timestamp: now };
  return data;
}

export const searchTokens = async (query: string): Promise<TokenSummary[]> => {
  if (!query || query.length < 2) return [];
  const data = await fetchWithCache(`${BASE_URL}/search?query=${query}`);
  return data.coins.slice(0, 10).map((c: any) => ({
    id: c.id,
    symbol: c.symbol,
    name: c.name,
    image: c.thumb,
  }));
};

export const getMarketData = async (id: string): Promise<TokenMarketData> => {
  const data = await fetchWithCache(`${BASE_URL}/coins/markets?vs_currency=usd&ids=${id}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`);
  if (!data || data.length === 0) throw new Error("Token not found");
  return data[0];
};

export const getHistoryData = async (id: string, days: number = 30): Promise<TokenHistory> => {
  return await fetchWithCache(`${BASE_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}`);
};
