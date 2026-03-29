import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../core/theme/colors';
import { fmt, priceColor } from '../../utils/formatters';
import { computePortfolio } from '../../utils/portfolio';
import { SectionLabel } from '../../components/SectionLabel';
import { StockRow } from '../../components/StockRow';
import { MetricCard } from '../../components/MetricCard';

const MOCK_HOLDINGS = [
  { symbol: 'AAPL', shares: 50, avgCost: 182.50 },
  { symbol: 'VTI',  shares: 20, avgCost: 245.00 },
  { symbol: 'JNJ',  shares: 15, avgCost: 158.20 },
  { symbol: 'MSFT', shares: 8,  avgCost: 405.00 },
];

const MOCK_PRICES: Record<string, { price: number; change: number; changePct: number; name: string; sector: string }> = {
  AAPL: { price: 185.50, change: 1.50,  changePct:  0.82, name: 'Apple Inc',           sector: 'Technology' },
  MSFT: { price: 412.30, change: -1.40, changePct: -0.34, name: 'Microsoft Corp',       sector: 'Technology' },
  SPY:  { price: 521.80, change: 0.78,  changePct:  0.15, name: 'S&P 500 ETF',          sector: 'ETF' },
  QQQ:  { price: 438.20, change: 2.10,  changePct:  0.48, name: 'Invesco QQQ',          sector: 'ETF' },
  VTI:  { price: 248.00, change: 0.60,  changePct:  0.24, name: 'Vanguard Total Mkt',   sector: 'ETF' },
  JNJ:  { price: 157.67, change: -0.53, changePct: -0.34, name: 'Johnson & Johnson',    sector: 'Healthcare' },
};

const MOCK_WATCHLIST = ['AAPL', 'MSFT', 'SPY', 'QQQ'];
const MOCK_CASH = 80_862;

export const HomeScreen: React.FC = () => {
  const portfolio = computePortfolio(
    MOCK_HOLDINGS,
    MOCK_PRICES,
    MOCK_CASH,
  );

  const returnColor = priceColor(portfolio.totalReturn);

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
            value={fmt.currencyWhole(MOCK_CASH)}
            valueColor={colors.ui.card}
          />
          <MetricCard
            label="Invested"
            value={fmt.currencyWhole(portfolio.invested)}
            valueColor={colors.ui.card}
          />
        </View>
      </LinearGradient>

      {/* Watchlist */}
      <View style={styles.section}>
        <SectionLabel title="Watchlist" action="See all →" onAction={() => {}} />
        {MOCK_WATCHLIST.map((symbol) => {
          const stock = MOCK_PRICES[symbol];
          return (
            <StockRow
              key={symbol}
              symbol={symbol}
              name={stock.name}
              price={stock.price}
              changePercent={stock.changePct}
              sector={stock.sector}
              onPress={() => {}}
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
