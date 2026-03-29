import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../core/theme/colors';

const SECTOR_COLORS: Record<string, { bg: string; text: string }> = {
  Technology: { bg: colors.accent.blueBg, text: colors.accent.blueDk },
  ETF:        { bg: colors.brand.tealBg, text: colors.brand.tealDark },
  Healthcare: { bg: colors.accent.coralBg, text: colors.accent.coralDk },
};

interface TickerAvatarProps {
  symbol: string;
  sector?: string;
  size?: number;
  testID?: string;
}

export const TickerAvatar: React.FC<TickerAvatarProps> = ({
  symbol,
  sector,
  size = 36,
  testID,
}) => {
  const sectorStyle = SECTOR_COLORS[sector || ''] || {
    bg: colors.ui.bg,
    text: colors.ui.textSec,
  };

  return (
    <View
      testID={testID}
      style={[styles.container, {
        width: size,
        height: size,
        borderRadius: 8,
        backgroundColor: sectorStyle.bg,
      }]}
    >
      <Text style={[styles.label, {
        fontSize: size * 0.31,
        color: sectorStyle.text,
      }]}>
        {symbol.slice(0, 2)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
  },
});
