import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../core/theme/colors';
import { FinnhubService, Quote } from '../../core/api/finnhubService';
import { StockRow } from '../../components/StockRow';
import { useWatchlistStore } from '../../stores/watchlistStore';
import type { SearchStackParamList } from '../../navigation/types';

type WatchlistNavigation = NativeStackNavigationProp<SearchStackParamList, 'Watchlist'>;

interface QuoteResult {
  symbol: string;
  quote: Quote | null;
}

export const WatchlistScreen: React.FC = () => {
  const navigation = useNavigation<WatchlistNavigation>();
  const { symbols, loading, error, fetchWatchlist, removeSymbol } = useWatchlistStore();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState<string | null>(null);

  useEffect(() => {
    void fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    let active = true;

    if (symbols.length === 0) {
      setQuotes({});
      setQuotesLoading(false);
      setQuotesError(null);
      return () => {
        active = false;
      };
    }

    setQuotesLoading(true);
    setQuotesError(null);

    Promise.all(
      symbols.map(async (symbol): Promise<QuoteResult> => {
        try {
          const quote = await FinnhubService.getQuote(symbol);
          return { symbol, quote };
        } catch {
          return { symbol, quote: null };
        }
      }),
    )
      .then((results) => {
        if (!active) return;

        const nextQuotes = results.reduce<Record<string, Quote>>((acc, result) => {
          if (result.quote) {
            acc[result.symbol] = result.quote;
          }
          return acc;
        }, {});

        setQuotes(nextQuotes);

        if (results.some((result) => !result.quote)) {
          setQuotesError('Some quotes could not load');
        }
      })
      .finally(() => {
        if (active) {
          setQuotesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [symbols]);

  const openStock = (symbol: string) => {
    navigation.navigate('StockDetail', { symbol });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Watchlist</Text>

      {loading ? (
        <View testID="watchlist-loading" style={styles.statePanel}>
          <ActivityIndicator color={colors.brand.teal} />
          <Text style={styles.stateText}>Loading watchlist...</Text>
        </View>
      ) : error ? (
        <Text testID="watchlist-error" style={styles.errorPanel}>{error}</Text>
      ) : symbols.length === 0 ? (
        <Text testID="watchlist-empty" style={styles.statePanelText}>No symbols in your watchlist yet.</Text>
      ) : (
        <View style={styles.list}>
          {quotesLoading ? (
            <Text testID="watchlist-quotes-loading" style={styles.statePanelText}>Loading quotes...</Text>
          ) : null}
          {quotesError ? (
            <Text testID="watchlist-quotes-error" style={styles.inlineError}>{quotesError}</Text>
          ) : null}
          {symbols.map((symbol) => {
            const quote = quotes[symbol];
            return (
              <View key={symbol} style={styles.rowShell}>
                <StockRow
                  symbol={symbol}
                  name={symbol}
                  price={quote?.currentPrice ?? 0}
                  changePercent={quote?.changePercent ?? 0}
                  onPress={() => openStock(symbol)}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => removeSymbol(symbol)}
                  style={styles.removeButton}
                  testID={`remove-watchlist-${symbol}`}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
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
  title: {
    color: colors.ui.text,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 16,
  },
  statePanel: {
    alignItems: 'center',
    backgroundColor: colors.ui.card,
    borderRadius: 12,
    gap: 8,
    padding: 24,
  },
  statePanelText: {
    backgroundColor: colors.ui.card,
    borderRadius: 12,
    color: colors.ui.textSec,
    fontSize: 14,
    padding: 18,
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
  list: {
    backgroundColor: colors.ui.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rowShell: {
    borderBottomColor: colors.ui.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  removeButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  removeText: {
    color: colors.semantic.negative,
    fontSize: 13,
    fontWeight: '700',
  },
  inlineError: {
    color: colors.semantic.negative,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
});
