import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../core/theme/colors';

interface MetricCardProps {
  label: string;
  value: string;
  valueColor?: string;
  testID?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  valueColor,
  testID,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text
        testID={testID}
        style={[styles.value, valueColor ? { color: valueColor } : null]}
      >
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    color: colors.ui.textSec,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ui.text,
  },
});
