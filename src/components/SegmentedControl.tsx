import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../core/theme/colors';

interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  selected: string;
  onSelect: (value: string) => void;
  activeColor?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selected,
  onSelect,
  activeColor,
}) => {
  const activeBg = activeColor ?? colors.brand.teal;

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isActive = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            testID={`segment-${opt.value}`}
            onPress={() => onSelect(opt.value)}
            style={[
              styles.item,
              isActive && { backgroundColor: activeBg },
            ]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.ui.bg,
    borderRadius: 8,
    padding: 2,
  },
  item: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ui.textSec,
  },
  labelActive: {
    color: colors.ui.card,
    fontWeight: '600',
  },
});
