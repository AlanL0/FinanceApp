import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { colors } from '../../core/theme/colors';
import { CompanyProfile, FinnhubService, Quote } from '../../core/api/finnhubService';
import { MetricCard } from '../../components/MetricCard';
import { SegmentedControl } from '../../components/SegmentedControl';
import { fmt, priceColor } from '../../utils/formatters';
import { useWatchlistStore } from '../../stores/watchlistStore';
import type { SearchStackParamList } from '../../navigation/types';
import { CompanyLogo } from './components/CompanyLogo';
import { PriceChart } from './components/PriceChart';

type StockDetailRoute = RouteProp<SearchStackParamList, 'StockDetail'>;
type ChartRange = '1D' | '1W' | '1M' | '3M' | '1Y';

const RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '1Y', label: '1Y' },
];

const RANGE_POINT_COUNT: Record<ChartRange, number> = {
  '1D': 14,
  '1W': 18,
  '1M': 24,
  '3M': 30,
  '1Y': 36,
};

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function makeChartPoints(quote: Quote, symbol: string, range: ChartRange): number[] {
  const count = RANGE_POINT_COUNT[range];
  const start = quote.previousClose || quote.open || quote.currentPrice;
  const end = quote.currentPrice;
  const spread = Math.max(Math.abs(quote.change), end * 0.006, 0.5);
  const symbolSeed = symbol.split('').reduce((total, char) => total + char.charCodeAt(0), 0);

  return Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    const trend = start + (end - start) * progress;
    const wave = Math.sin((progress * Math.PI * 2) + symbolSeed) * spread * 0.35;
    return Number((trend + wave).toFixed(2));
  });
}

function quoteErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to load quote';
}

export const StockDetailScreen: React.FC = () => {
  const route = useRoute<StockDetailRoute>();
  const symbol = normalizeSymbol(route.params.symbol);
  const description = route.params.description ?? symbol;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<ChartRange>('1M');
  const {
    symbols,
    loading: watchlistLoading,
    error: watchlistError,
    fetchWatchlist,
    addSymbol,
    removeSymbol,
  } = useWatchlistStore();
  const isWatched = symbols.includes(symbol);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    FinnhubService.getQuote(symbol)
      .then((nextQuote) => {
        if (!active) return;
        setQuote(nextQuote);
      })
      .catch((quoteError: unknown) => {
        if (!active) return;
        setError(quoteErrorMessage(quoteError));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [symbol]);

  useEffect(() => {
    let active = true;
    setProfile(null);

    FinnhubService.getCompanyProfile(symbol)
      .then((companyProfile) => {
        if (!active) return;
        setProfile(companyProfile);
      })
      .catch(() => {
        if (active) {
          setProfile(null);
        }
      });

    return () => {
      active = false;
    };
  }, [symbol]);

  useEffect(() => {
    void fetchWatchlist();
  }, [fetchWatchlist]);

  const chartPoints = useMemo(
    () => (quote ? makeChartPoints(quote, symbol, selectedRange) : []),
    [quote, selectedRange, symbol],
  );
  const accentColor = quote ? priceColor(quote.changePercent) : colors.brand.teal;

  const toggleWatchlist = async () => {
    if (isWatched) {
      await removeSymbol(symbol);
      return;
    }

    await addSymbol(symbol);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <CompanyLogo
          symbol={symbol}
          logoUrl={profile?.logo}
          industry={profile?.industry}
          size={58}
        />
        <View style={styles.headerText}>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text numberOfLines={1} style={styles.description}>
            {profile?.name || description}
          </Text>
          {profile?.exchange ? (
            <Text numberOfLines={1} style={styles.exchange}>{profile.exchange}</Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={watchlistLoading}
          onPress={toggleWatchlist}
          style={[styles.watchlistButton, isWatched && styles.watchlistButtonActive]}
          testID="watchlist-toggle"
        >
          <Text style={[styles.watchlistText, isWatched && styles.watchlistTextActive]}>
            {isWatched ? 'Remove' : 'Add'}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View testID="stock-detail-loading" style={styles.statePanel}>
          <ActivityIndicator color={colors.brand.teal} />
          <Text style={styles.stateText}>Loading quote...</Text>
        </View>
      ) : error ? (
        <Text testID="stock-detail-error" style={styles.errorPanel}>{error}</Text>
      ) : quote ? (
        <>
          <View style={styles.quotePanel}>
            <Text testID="stock-detail-price" style={styles.price}>
              {fmt.currency(quote.currentPrice)}
            </Text>
            <Text style={[styles.change, { color: accentColor }]}>
              {fmt.signed(quote.change)} ({fmt.pct(quote.changePercent)})
            </Text>
          </View>

          <View style={styles.chartPanel}>
            <PriceChart points={chartPoints} color={accentColor} />
            <SegmentedControl
              options={RANGE_OPTIONS}
              selected={selectedRange}
              onSelect={(range) => setSelectedRange(range as ChartRange)}
              activeColor={accentColor}
            />
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCell}>
              <MetricCard label="Open" value={fmt.currency(quote.open)} testID="stock-stat-open" />
            </View>
            <View style={styles.metricCell}>
              <MetricCard label="High" value={fmt.currency(quote.high)} testID="stock-stat-high" />
            </View>
            <View style={styles.metricCell}>
              <MetricCard label="Low" value={fmt.currency(quote.low)} testID="stock-stat-low" />
            </View>
            <View style={styles.metricCell}>
              <MetricCard
                label="Prev Close"
                value={fmt.currency(quote.previousClose)}
                testID="stock-stat-prev-close"
              />
            </View>
            <View style={styles.metricCell}>
              <MetricCard label="Change" value={fmt.signed(quote.change)} valueColor={accentColor} />
            </View>
            <View style={styles.metricCell}>
              <MetricCard label="Source" value={quote.source ?? 'network'} />
            </View>
          </View>
        </>
      ) : null}

      {watchlistError ? (
        <Text testID="stock-detail-watchlist-error" style={styles.inlineError}>{watchlistError}</Text>
      ) : null}

      <View style={styles.tradeActions}>
        <Pressable disabled accessibilityState={{ disabled: true }} style={[styles.tradeButton, styles.buyButton]}>
          <Text style={styles.tradeText}>Buy</Text>
        </Pressable>
        <Pressable disabled accessibilityState={{ disabled: true }} style={[styles.tradeButton, styles.sellButton]}>
          <Text style={styles.tradeText}>Sell</Text>
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
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 12,
  },
  symbol: {
    color: colors.ui.text,
    fontSize: 32,
    fontWeight: '800',
  },
  description: {
    color: colors.ui.textSec,
    fontSize: 14,
    marginTop: 2,
  },
  exchange: {
    color: colors.ui.textSec,
    fontSize: 12,
    marginTop: 2,
  },
  watchlistButton: {
    backgroundColor: colors.brand.teal,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  watchlistButtonActive: {
    backgroundColor: colors.ui.card,
    borderColor: colors.ui.border,
    borderWidth: 1,
  },
  watchlistText: {
    color: colors.ui.card,
    fontSize: 13,
    fontWeight: '700',
  },
  watchlistTextActive: {
    color: colors.ui.text,
  },
  statePanel: {
    alignItems: 'center',
    backgroundColor: colors.ui.card,
    borderRadius: 12,
    gap: 8,
    padding: 24,
  },
  stateText: {
    color: colors.ui.textSec,
    fontSize: 14,
  },
  errorPanel: {
    backgroundColor: colors.ui.card,
    borderRadius: 12,
    color: colors.semantic.negative,
    fontSize: 14,
    padding: 18,
  },
  quotePanel: {
    backgroundColor: colors.ui.card,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  price: {
    color: colors.ui.text,
    fontSize: 34,
    fontWeight: '800',
  },
  change: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  chartPanel: {
    backgroundColor: colors.ui.card,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  metricsGrid: {
    backgroundColor: colors.ui.card,
    borderRadius: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    padding: 8,
  },
  metricCell: {
    padding: 8,
    width: '50%',
  },
  inlineError: {
    color: colors.semantic.negative,
    fontSize: 13,
    marginBottom: 12,
  },
  tradeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  tradeButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    opacity: 0.6,
    paddingVertical: 14,
  },
  buyButton: {
    backgroundColor: colors.brand.teal,
  },
  sellButton: {
    backgroundColor: colors.semantic.negative,
  },
  tradeText: {
    color: colors.ui.card,
    fontSize: 15,
    fontWeight: '800',
  },
});
