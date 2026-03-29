import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../core/theme/colors';

interface SectionLabelProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
  title,
  action,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action != null && (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ui.text,
  },
  action: {
    fontSize: 13,
    color: colors.brand.teal,
  },
});
