import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { TickerAvatar } from '../../../components/TickerAvatar';
import { colors } from '../../../core/theme/colors';

interface CompanyLogoProps {
  symbol: string;
  logoUrl?: string;
  industry?: string;
  size?: number;
  testID?: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  symbol,
  logoUrl,
  industry,
  size = 56,
  testID = 'company-logo',
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const hasLogo = Boolean(logoUrl && !imageFailed);

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  if (!hasLogo) {
    return (
      <TickerAvatar
        symbol={symbol}
        sector={industry}
        size={size}
        testID={`${testID}-fallback`}
      />
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: 10,
        },
      ]}
    >
      <Image
        accessibilityLabel={`${symbol} logo`}
        onError={() => setImageFailed(true)}
        resizeMode="contain"
        source={{ uri: logoUrl }}
        style={styles.image}
        testID={`${testID}-image`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    backgroundColor: colors.ui.card,
    borderColor: colors.ui.border,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    height: '82%',
    width: '82%',
  },
});
