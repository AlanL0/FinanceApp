import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { colors } from '../../core/theme/colors';
import { fmt, priceColor } from '../../utils/formatters';
import { computePortfolio, Holding as PortfolioHolding, StockPrice } from '../../utils/portfolio';
import { SectionLabel } from '../../components/SectionLabel';
import { StockRow } from '../../components/StockRow';
import { MetricCard } from '../../components/MetricCard';
import { CompanyProfile, FinnhubService, Quote } from '../../core/api/finnhubService';
import { usePortfolioStore } from '../../stores/portfolioStore';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { LivePrice, usePriceStore } from '../../stores/priceStore';
import { Holding as DatabaseHolding } from '../../core/api/database.types';
import type { MainTabParamList } from '../../navigation/types';

const MARKET_SNAPSHOT_SYMBOL = 'AAPL';
const HOME_SYMBOL_LIMIT = 50;

interface DisplayPrice {
  price: number;
  change: number;
  changePercent: number;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function uniqueLimitedSymbols(symbols: string[]): string[] {
  return Array.from(new Set(
    symbols
      .map(normalizeSymbol)
      .filter((symbol) => symbol.length > 0),
  )).slice(0, HOME_SYMBOL_LIMIT);
}

function toPortfolioHolding(holding: DatabaseHolding): PortfolioHolding {
  return {
    symbol: normalizeSymbol(holding.symbol),
    shares: holding.shares,
    avgCost: holding.avg_cost_basis,
  };
}

function getDisplayPrice(
  symbol: string,
  livePrice: LivePrice | undefined,
  quote: Quote | undefined,
): DisplayPrice {
  if (livePrice) {
    return {
      price: livePrice.price,
      change: livePrice.change ?? quote?.change ?? 0,
      changePercent: livePrice.changePercent ?? quote?.changePercent ?? 0,
    };
  }

  if (quote) {
    return {
      price: quote.currentPrice,
      change: quote.change,
      changePercent: quote.changePercent,
    };
  }

  return { price: 0, change: 0, changePercent: 0 };
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const {
    holdings,
    cash,
    loading: portfolioLoading,
    error: portfolioError,
    fetchPortfolio,
  } = usePortfolioStore();
  const {
    symbols: watchlistSymbols,
    loading: watchlistLoading,
    error: watchlistError,
    fetchWatchlist,
  } = useWatchlistStore();
  const {
    pricesBySymbol,
    error: priceError,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  } = usePriceStore();
  const subscribedSymbolsRef = useRef<string[]>([]);
  const quoteRequestsRef = useRef<Set<string>>(new Set());
  const profileRequestsRef = useRef<Set<string>>(new Set());
  const [fallbackQuotes, setFallbackQuotes] = useState<Record<string, Quote>>({});
  const [quoteErrors, setQuoteErrors] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<Record<string, CompanyProfile>>({});

  const portfolioHoldings = useMemo(
    () => holdings.map(toPortfolioHolding),
    [holdings],
  );

  const trackedSymbols = useMemo(
    () => uniqueLimitedSymbols([
      ...portfolioHoldings.map((holding) => holding.symbol),
      ...watchlistSymbols,
      MARKET_SNAPSHOT_SYMBOL,
    ]),
    [portfolioHoldings, watchlistSymbols],
  );

  const trackedSymbolsKey = trackedSymbols.join('|');

  const pricesForSymbols = useMemo(
    () => trackedSymbols.reduce<Record<string, DisplayPrice>>((acc, symbol) => {
      acc[symbol] = getDisplayPrice(symbol, pricesBySymbol[symbol], fallbackQuotes[symbol]);
      return acc;
    }, {}),
    [fallbackQuotes, pricesBySymbol, trackedSymbols],
  );

  const portfolioPrices = useMemo(
    () => portfolioHoldings.reduce<Record<string, StockPrice>>((acc, holding) => {
      const price = pricesForSymbols[holding.symbol] ?? { price: 0, change: 0 };
      acc[holding.symbol] = {
        price: price.price,
        change: price.change,
      };
      return acc;
    }, {}),
    [portfolioHoldings, pricesForSymbols],
  );

  const portfolio = computePortfolio(portfolioHoldings, portfolioPrices, cash ?? 0);
  const returnColor = priceColor(portfolio.totalReturn);
  const aaplLivePrice = pricesBySymbol[MARKET_SNAPSHOT_SYMBOL];
  const aaplQuote = fallbackQuotes[MARKET_SNAPSHOT_SYMBOL];
  const aaplPrice = pricesForSymbols[MARKET_SNAPSHOT_SYMBOL];
  const hasMarketSnapshotPrice = Boolean(aaplLivePrice || aaplQuote);
  const marketError = quoteErrors[MARKET_SNAPSHOT_SYMBOL];
  const loading = portfolioLoading || watchlistLoading;
  const errors = [portfolioError, watchlistError, priceError]
    .filter((error): error is string => Boolean(error));

  useEffect(() => {
    void fetchPortfolio();
    void fetchWatchlist();
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect, fetchPortfolio, fetchWatchlist]);

  useEffect(() => {
    const previousSymbols = subscribedSymbolsRef.current;
    const addedSymbols = trackedSymbols.filter((symbol) => !previousSymbols.includes(symbol));
    const removedSymbols = previousSymbols.filter((symbol) => !trackedSymbols.includes(symbol));

    if (addedSymbols.length > 0) {
      subscribe(addedSymbols);
    }

    if (removedSymbols.length > 0) {
      unsubscribe(removedSymbols);
    }

    subscribedSymbolsRef.current = trackedSymbols;
  }, [subscribe, trackedSymbols, trackedSymbolsKey, unsubscribe]);

  useEffect(() => () => {
    if (subscribedSymbolsRef.current.length > 0) {
      unsubscribe(subscribedSymbolsRef.current);
    }
  }, [unsubscribe]);

  useEffect(() => {
    let active = true;
    const missingQuoteSymbols = trackedSymbols.filter((symbol) => (
      !pricesBySymbol[symbol] &&
      !fallbackQuotes[symbol] &&
      !quoteErrors[symbol] &&
      !quoteRequestsRef.current.has(symbol)
    ));

    if (missingQuoteSymbols.length === 0) {
      return () => {
        active = false;
      };
    }

    missingQuoteSymbols.forEach((symbol) => quoteRequestsRef.current.add(symbol));

    Promise.all(
      missingQuoteSymbols.map(async (symbol) => {
        try {
          const quote = await FinnhubService.getQuote(symbol);
          return { symbol, quote, error: null };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to load quote';
          return { symbol, quote: null, error: message };
        }
      }),
    ).then((results) => {
      if (!active) return;

      setFallbackQuotes((currentQuotes) => {
        const nextQuotes = { ...currentQuotes };
        results.forEach((result) => {
          if (result.quote) {
            nextQuotes[result.symbol] = result.quote;
          }
        });
        return nextQuotes;
      });

      setQuoteErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        results.forEach((result) => {
          if (result.error) {
            nextErrors[result.symbol] = result.error;
          }
        });
        return nextErrors;
      });
    }).finally(() => {
      missingQuoteSymbols.forEach((symbol) => quoteRequestsRef.current.delete(symbol));
    });

    return () => {
      active = false;
    };
  }, [fallbackQuotes, pricesBySymbol, quoteErrors, trackedSymbols, trackedSymbolsKey]);

  useEffect(() => {
    let active = true;
    const visibleWatchlistSymbols = uniqueLimitedSymbols(watchlistSymbols);
    const missingProfileSymbols = visibleWatchlistSymbols.filter((symbol) => (
      !profiles[symbol] && !profileRequestsRef.current.has(symbol)
    ));

    if (missingProfileSymbols.length === 0) {
      return () => {
        active = false;
      };
    }

    missingProfileSymbols.forEach((symbol) => profileRequestsRef.current.add(symbol));

    Promise.all(
      missingProfileSymbols.map(async (symbol) => {
        try {
          const profile = await FinnhubService.getCompanyProfile(symbol);
          return { symbol, profile };
        } catch {
          return { symbol, profile: null };
        }
      }),
    ).then((results) => {
      if (!active) return;

      setProfiles((currentProfiles) => {
        const nextProfiles = { ...currentProfiles };
        results.forEach((result) => {
          if (result.profile) {
            nextProfiles[result.symbol] = result.profile;
          }
        });
        return nextProfiles;
      });
    }).finally(() => {
      missingProfileSymbols.forEach((symbol) => profileRequestsRef.current.delete(symbol));
    });

    return () => {
      active = false;
    };
  }, [profiles, watchlistSymbols]);

  const openStock = (symbol: string) => {
    navigation.navigate('Search', {
      screen: 'StockDetail',
      params: { symbol },
    });
  };

  const openWatchlist = () => {
    navigation.navigate('Search', { screen: 'Watchlist', params: { returnToHome: true } });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* Portfolio Hero Card */}
      <LinearGradient
        colors={[colors.brand.navy, colors.brand.tealDark]}
        style={styles.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.heroLabel}>Your portfolio</Text>
        <Text testID="portfolio-total" style={styles.heroValue}>
          {fmt.currency(portfolio.total)}
        </Text>
        <Text style={[styles.heroReturn, { color: returnColor }]}>
          {fmt.signed(portfolio.totalReturn)} ({fmt.pct(portfolio.returnPct)})
        </Text>

        <View style={styles.heroMetrics}>
          <MetricCard
            label="Today"
            value={fmt.signed(portfolio.dayChange)}
            valueColor={priceColor(portfolio.dayChange)}
          />
          <MetricCard
            label="Cash"
            value={fmt.currencyWhole(cash ?? 0)}
            valueColor={colors.ui.card}
          />
          <MetricCard
            label="Invested"
            value={fmt.currencyWhole(portfolio.invested)}
            valueColor={colors.ui.card}
          />
        </View>
      </LinearGradient>

      {loading ? (
        <Text testID="home-loading" style={styles.statusText}>Loading dashboard...</Text>
      ) : null}

      {errors.length > 0 ? (
        <Text testID="home-error" style={styles.errorText}>{errors.join(' · ')}</Text>
      ) : null}

      <View style={styles.section}>
        <View style={styles.marketCard}>
          <Text style={styles.marketLabel}>Market Snapshot</Text>
          <Text style={styles.marketSymbol}>AAPL</Text>
          {!hasMarketSnapshotPrice && !marketError ? (
            <Text testID="market-snapshot-loading" style={styles.marketMeta}>Loading quote...</Text>
          ) : marketError ? (
            <Text testID="market-snapshot-error" style={styles.marketError}>{marketError}</Text>
          ) : hasMarketSnapshotPrice ? (
            <View testID="market-snapshot-quote">
              <Text style={styles.marketPrice}>{fmt.currency(aaplPrice.price)}</Text>
              <Text style={[styles.marketMeta, { color: priceColor(aaplPrice.changePercent) }]}>
                {fmt.pct(aaplPrice.changePercent)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Watchlist */}
      <View style={styles.section}>
        <SectionLabel title="Watchlist" action="See all →" onAction={openWatchlist} />
        {watchlistSymbols.length === 0 ? (
          <Text testID="home-watchlist-empty" style={styles.emptyText}>No watchlist symbols yet.</Text>
        ) : watchlistSymbols.map((symbol) => {
          const normalizedSymbol = normalizeSymbol(symbol);
          const stockPrice = pricesForSymbols[normalizedSymbol] ?? { price: 0, changePercent: 0 };
          const profile = profiles[normalizedSymbol];

          return (
            <StockRow
              key={normalizedSymbol}
              symbol={normalizedSymbol}
              name={profile?.name || normalizedSymbol}
              price={stockPrice.price}
              changePercent={stockPrice.changePercent}
              sector={profile?.industry}
              logoUrl={profile?.logo}
              onPress={() => openStock(normalizedSymbol)}
            />
          );
        })}
      </View>

      {/* Continue Learning Card */}
      <View style={styles.section}>
        <Pressable style={styles.learnCard}>
          <View style={styles.learnHeader}>
            <Text style={styles.learnTitle}>Continue Learning</Text>
            <Text style={styles.learnArrow}>→</Text>
          </View>
          <Text style={styles.learnSubtitle}>How to read a balance sheet</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>
          <Text style={styles.progressLabel}>Lesson 2 of 5 · 40% complete</Text>
        </Pressable>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ui.bg,
  },
  content: {
    paddingTop: 48,
    paddingBottom: 32,
  },
  heroCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.ui.card,
    marginBottom: 4,
  },
  heroReturn: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },
  heroMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  statusText: {
    color: colors.ui.textSec,
    fontSize: 13,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  errorText: {
    color: colors.semantic.negative,
    fontSize: 13,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  marketCard: {
    backgroundColor: colors.ui.card,
    borderRadius: 12,
    padding: 16,
  },
  marketLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ui.textSec,
    marginBottom: 8,
  },
  marketSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ui.text,
    marginBottom: 4,
  },
  marketPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ui.text,
  },
  marketMeta: {
    fontSize: 13,
    color: colors.ui.textSec,
  },
  marketError: {
    fontSize: 13,
    color: colors.semantic.negative,
  },
  emptyText: {
    backgroundColor: colors.ui.card,
    borderRadius: 12,
    color: colors.ui.textSec,
    fontSize: 14,
    padding: 16,
  },
  learnCard: {
    backgroundColor: colors.brand.navy,
    borderRadius: 12,
    padding: 16,
  },
  learnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  learnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ui.card,
  },
  learnArrow: {
    fontSize: 15,
    color: colors.brand.tealLight,
  },
  learnSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.brand.tealLight,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
});
