import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import { colors } from '../core/theme/colors';
import { fmt, priceColor } from '../utils/formatters';
import { TickerAvatar } from './TickerAvatar';

interface StockRowProps {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  sector?: string;
  logoUrl?: string;
  onPress: () => void;
  onLongPress?: (event: GestureResponderEvent) => void;
}

export const StockRow: React.FC<StockRowProps> = ({
  symbol,
  name,
  price,
  changePercent,
  sector,
  logoUrl,
  onPress,
  onLongPress,
}) => {
  const changeColor = priceColor(changePercent);
  const [logoFailed, setLogoFailed] = useState(false);
  const hasLogo = Boolean(logoUrl && !logoFailed);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  return (
    <Pressable
      testID={`stock-row-${symbol}`}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      style={styles.container}
    >
      {hasLogo ? (
        <View testID={`stock-row-logo-${symbol}`} style={styles.logoFrame}>
          <Image
            accessibilityLabel={`${symbol} logo`}
            onError={() => setLogoFailed(true)}
            resizeMode="contain"
            source={{ uri: logoUrl }}
            style={styles.logo}
            testID={`stock-row-logo-${symbol}-image`}
          />
        </View>
      ) : (
        <TickerAvatar symbol={symbol} sector={sector} testID={`stock-row-logo-${symbol}-fallback`} />
      )}
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
  logoFrame: {
    alignItems: 'center',
    backgroundColor: colors.ui.card,
    borderColor: colors.ui.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 36,
  },
  logo: {
    height: '82%',
    width: '82%',
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
