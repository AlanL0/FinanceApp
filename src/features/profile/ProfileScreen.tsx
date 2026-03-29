import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../core/theme/colors';
import { useAuthStore } from '../../stores/authStore';

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuthStore();

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>
      </View>

      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ui.bg,
    padding: 24,
    paddingTop: 64,
  },
  card: {
    backgroundColor: colors.ui.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  label: {
    fontSize: 12,
    color: colors.ui.textSec,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.ui.text,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: colors.semantic.negative,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    color: colors.semantic.negative,
    fontSize: 16,
    fontWeight: '600',
  },
});
