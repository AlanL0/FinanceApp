import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../core/theme/colors';
import { fmt, priceColor } from '../utils/formatters';
import { TickerAvatar } from './TickerAvatar';

interface StockRowProps {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  sector?: string;
  onPress: () => void;
}

export const StockRow: React.FC<StockRowProps> = ({
  symbol,
  name,
  price,
  changePercent,
  sector,
  onPress,
}) => {
  const changeColor = priceColor(changePercent);

  return (
    <Pressable testID={`stock-row-${symbol}`} onPress={onPress} style={styles.container}>
      <TickerAvatar symbol={symbol} sector={sector} />
      <View style={styles.info}>
        <Text style={styles.symbol}>{symbol}</Text>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
      </View>
      <View style={styles.prices}>
        <Text style={styles.price}>{fmt.currency(price)}</Text>
        <Text testID={`change-pct-${symbol}`} style={[styles.changePct, { color: changeColor }]}>
          {fmt.pct(changePercent)}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.ui.card,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  symbol: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ui.text,
  },
  name: {
    fontSize: 12,
    color: colors.ui.textSec,
    marginTop: 2,
  },
  prices: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ui.text,
  },
  changePct: {
    fontSize: 12,
    marginTop: 2,
  },
});
