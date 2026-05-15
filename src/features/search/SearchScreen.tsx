import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../core/theme/colors';
import { CompanyProfile, FinnhubService, SearchResult } from '../../core/api/finnhubService';
import type { SearchStackParamList } from '../../navigation/types';
import { CompanyLogo } from '../stocks/components/CompanyLogo';

type SearchNavigation = NativeStackNavigationProp<SearchStackParamList, 'SearchHome'>;
const SEARCH_LOGO_LIMIT = 8;

function normalizeResult(result: SearchResult): SearchResult {
  return {
    ...result,
    symbol: result.symbol.trim().toUpperCase(),
  };
}

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchNavigation>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [profilesBySymbol, setProfilesBySymbol] = useState<Record<string, CompanyProfile>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  useEffect(() => {
    let active = true;

    if (!hasQuery) {
      setResults([]);
      setProfilesBySymbol({});
      setError(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setProfilesBySymbol({});
    setError(null);

    const timeoutId = setTimeout(() => {
      FinnhubService.searchSymbol(trimmedQuery)
        .then((searchResults) => {
          if (!active) return;
          setResults(searchResults.map(normalizeResult));
        })
        .catch((searchError: unknown) => {
          if (!active) return;
          const message = searchError instanceof Error ? searchError.message : 'Unable to search symbols';
          setError(message);
          setResults([]);
          setProfilesBySymbol({});
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [hasQuery, trimmedQuery]);

  useEffect(() => {
    let active = true;
    const logoSymbols = results
      .slice(0, SEARCH_LOGO_LIMIT)
      .map((result) => result.symbol);

    if (logoSymbols.length === 0) {
      return () => {
        active = false;
      };
    }

    Promise.all(
      logoSymbols.map(async (symbol): Promise<[string, CompanyProfile] | null> => {
        try {
          const profile = await FinnhubService.getCompanyProfile(symbol);
          return [symbol, profile];
        } catch {
          return null;
        }
      }),
    ).then((entries) => {
      if (!active) return;

      setProfilesBySymbol((currentProfiles) => {
        const nextProfiles = { ...currentProfiles };
        entries.forEach((entry) => {
          if (entry) {
            nextProfiles[entry[0]] = entry[1];
          }
        });
        return nextProfiles;
      });
    });

    return () => {
      active = false;
    };
  }, [results]);

  const openStock = (result: SearchResult) => {
    navigation.navigate('StockDetail', {
      symbol: result.symbol,
      description: result.description,
    });
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Markets</Text>
          <Text style={styles.title}>US Stocks</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Watchlist')}
          style={styles.watchlistButton}
        >
          <Text style={styles.watchlistButtonText}>Watchlist</Text>
        </Pressable>
      </View>

      <TextInput
        autoCapitalize="characters"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={setQuery}
        placeholder="US symbol or company"
        placeholderTextColor={colors.ui.textSec}
        style={styles.input}
        testID="stock-search-input"
        value={query}
      />

      <View style={styles.resultsPanel}>
        {loading ? (
          <View testID="stock-search-loading" style={styles.centerState}>
            <ActivityIndicator color={colors.brand.teal} />
            <Text style={styles.stateText}>Searching...</Text>
          </View>
        ) : error ? (
          <Text testID="stock-search-error" style={styles.errorText}>{error}</Text>
        ) : hasQuery && results.length === 0 ? (
          <Text testID="stock-search-empty" style={styles.stateText}>No US stock matches found</Text>
        ) : (
          results.map((result) => {
            const profile = profilesBySymbol[result.symbol];

            return (
              <Pressable
                key={`${result.symbol}-${result.description}`}
                onPress={() => openStock(result)}
                style={styles.resultRow}
                testID={`search-result-${result.symbol}`}
              >
                <CompanyLogo
                  symbol={result.symbol}
                  logoUrl={profile?.logo}
                  industry={profile?.industry || result.type}
                  size={36}
                  testID={`search-logo-${result.symbol}`}
                />
                <View style={styles.resultText}>
                  <Text style={styles.resultSymbol}>{result.symbol}</Text>
                  <Text numberOfLines={1} style={styles.resultDescription}>
                    {result.description || profile?.name || 'Unknown company'}
                  </Text>
                </View>
                <Text style={styles.resultType}>{result.type || 'Stock'}</Text>
              </Pressable>
            );
          })
        )}
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
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  eyebrow: {
    color: colors.brand.tealDark,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ui.text,
    fontSize: 30,
    fontWeight: '700',
  },
  watchlistButton: {
    backgroundColor: colors.brand.teal,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  watchlistButtonText: {
    color: colors.ui.card,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.ui.card,
    borderColor: colors.ui.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.ui.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resultsPanel: {
    backgroundColor: colors.ui.card,
    borderRadius: 12,
    marginTop: 16,
    overflow: 'hidden',
  },
  centerState: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
  },
  stateText: {
    color: colors.ui.textSec,
    fontSize: 14,
    padding: 18,
  },
  errorText: {
    color: colors.semantic.negative,
    fontSize: 14,
    padding: 18,
  },
  resultRow: {
    alignItems: 'center',
    borderBottomColor: colors.ui.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultText: {
    flex: 1,
    marginLeft: 12,
  },
  resultSymbol: {
    color: colors.ui.text,
    fontSize: 15,
    fontWeight: '700',
  },
  resultDescription: {
    color: colors.ui.textSec,
    fontSize: 12,
    marginTop: 2,
  },
  resultType: {
    color: colors.ui.textSec,
    fontSize: 11,
    marginLeft: 8,
  },
});
