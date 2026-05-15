import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../core/theme/colors';
import { CompanyProfile, FinnhubService, Quote } from '../../core/api/finnhubService';
import { StockRow } from '../../components/StockRow';
import { useWatchlistStore } from '../../stores/watchlistStore';
import type { MainTabParamList, SearchStackParamList } from '../../navigation/types';

type WatchlistNavigation = NativeStackNavigationProp<SearchStackParamList, 'Watchlist'>;
const WATCHLIST_REORDER_ROW_HEIGHT = 96;

interface QuoteResult {
  symbol: string;
  quote: Quote | null;
}

interface ProfileResult {
  symbol: string;
  profile: CompanyProfile | null;
}

export const WatchlistScreen: React.FC = () => {
  const navigation = useNavigation<WatchlistNavigation>();
  const { symbols, loading, error, fetchWatchlist, removeSymbol, moveSymbolToIndex } = useWatchlistStore();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [profiles, setProfiles] = useState<Record<string, CompanyProfile>>({});
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [draggingSymbol, setDraggingSymbol] = useState<string | null>(null);
  const dragStateRef = useRef<{
    symbol: string;
    startIndex: number;
    currentIndex: number;
    startY: number;
  } | null>(null);
  const symbolsRef = useRef(symbols);

  useEffect(() => {
    void fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  useEffect(() => {
    let active = true;

    if (symbols.length === 0) {
      setQuotes({});
      setProfiles({});
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

  useEffect(() => {
    let active = true;

    if (symbols.length === 0) {
      setProfiles({});
      return () => {
        active = false;
      };
    }

    Promise.all(
      symbols.map(async (symbol): Promise<ProfileResult> => {
        try {
          const profile = await FinnhubService.getCompanyProfile(symbol);
          return { symbol, profile };
        } catch {
          return { symbol, profile: null };
        }
      }),
    ).then((results) => {
      if (!active) return;

      const nextProfiles = results.reduce<Record<string, CompanyProfile>>((acc, result) => {
        if (result.profile) {
          acc[result.symbol] = result.profile;
        }
        return acc;
      }, {});

      setProfiles(nextProfiles);
    });

    return () => {
      active = false;
    };
  }, [symbols]);

  const openStock = (symbol: string) => {
    navigation.navigate('StockDetail', { symbol });
  };

  const goBack = () => {
    const tabNavigation = navigation.getParent<NavigationProp<MainTabParamList>>();

    if (tabNavigation) {
      tabNavigation.navigate('Home');
      return;
    }

    navigation.goBack();
  };

  const clampDragIndex = (index: number) => (
    Math.min(Math.max(index, 0), symbolsRef.current.length - 1)
  );

  const beginReorder = (symbol: string, index: number, event: GestureResponderEvent) => {
    dragStateRef.current = {
      symbol,
      startIndex: index,
      currentIndex: index,
      startY: event.nativeEvent.pageY,
    };
    setDraggingSymbol(symbol);
  };

  const finishReorder = () => {
    dragStateRef.current = null;
    setDraggingSymbol(null);
  };

  const updateReorder = (event: GestureResponderEvent) => {
    const dragState = dragStateRef.current;

    if (!dragState) {
      return;
    }

    const dragOffset = event.nativeEvent.pageY - dragState.startY;
    const nextIndex = clampDragIndex(
      dragState.startIndex + Math.round(dragOffset / WATCHLIST_REORDER_ROW_HEIGHT),
    );

    if (nextIndex === dragState.currentIndex) {
      return;
    }

    moveSymbolToIndex(dragState.symbol, nextIndex);
    dragState.currentIndex = nextIndex;
  };

  return (
    <ScrollView
      scrollEnabled={!draggingSymbol}
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          hitSlop={10}
          onPress={goBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          testID="watchlist-back-button"
        >
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>

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
        <View
          onTouchCancel={finishReorder}
          onTouchEnd={finishReorder}
          onTouchMove={updateReorder}
          style={styles.list}
          testID="watchlist-list"
        >
          {quotesLoading ? (
            <Text testID="watchlist-quotes-loading" style={styles.statePanelText}>Loading quotes...</Text>
          ) : null}
          {quotesError ? (
            <Text testID="watchlist-quotes-error" style={styles.inlineError}>{quotesError}</Text>
          ) : null}
          {symbols.map((symbol, index) => {
            const quote = quotes[symbol];
            const profile = profiles[symbol];
            const isDragging = draggingSymbol === symbol;
            return (
              <View
                key={symbol}
                style={[styles.rowShell, isDragging && styles.draggingRow]}
                testID={`watchlist-draggable-${symbol}`}
              >
                <StockRow
                  symbol={symbol}
                  name={profile?.name || symbol}
                  price={quote?.currentPrice ?? 0}
                  changePercent={quote?.changePercent ?? 0}
                  sector={profile?.industry}
                  logoUrl={profile?.logo}
                  onPress={() => openStock(symbol)}
                  onLongPress={(event) => beginReorder(symbol, index, event)}
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
    paddingTop: 48,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  backButtonPressed: {
    opacity: 0.55,
  },
  backText: {
    color: colors.brand.teal,
    fontSize: 16,
    fontWeight: '600',
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
  draggingRow: {
    backgroundColor: colors.ui.bg,
    opacity: 0.88,
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
