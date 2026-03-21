import axios from 'axios';
import { FINNHUB_API_KEY } from '@env';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = FINNHUB_API_KEY || '';

export interface Quote {
  currentPrice: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  change: number;
  changePercent: number;
}

export interface SearchResult {
  symbol: string;
  description: string;
  type: string;
}

export const FinnhubService = {
  async getQuote(symbol: string): Promise<Quote> {
    const { data } = await axios.get(
      `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`
    );
    if (data.c === 0 && data.o === 0) {
      throw new Error('Invalid symbol');
    }
    return {
      currentPrice: data.c,
      open: data.o,
      high: data.h,
      low: data.l,
      previousClose: data.pc,
      change: data.d,
      changePercent: data.dp,
    };
  },

  async searchSymbol(query: string): Promise<SearchResult[]> {
    const { data } = await axios.get(
      `${FINNHUB_BASE_URL}/search?q=${query}&token=${API_KEY}`
    );
    return (data.result || []).map((r: any) => ({
      symbol: r.symbol,
      description: r.description,
      type: r.type,
    }));
  },
};
