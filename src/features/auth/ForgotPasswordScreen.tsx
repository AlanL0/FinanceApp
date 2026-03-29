import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../core/theme/colors';
import { supabase } from '../../core/api/supabase';
import { validateEmail } from '../../utils/validation';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setError(null);
    const emailError = validateEmail(email);
    if (emailError) { setError(emailError); return; }

    setLoading(true);
    const { error: apiError } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (apiError) { setError(apiError.message); return; }
    setSuccess(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>We'll send a reset link to your email</Text>

        {success ? (
          <Text style={styles.successMsg}>Password reset email sent</Text>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.ui.textSec}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {error != null && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.button} onPress={handleReset} disabled={loading}>
              {loading
                ? <ActivityIndicator color={colors.ui.card} />
                : <Text style={styles.buttonText}>Reset Password</Text>}
            </Pressable>
          </>
        )}

        <Pressable onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.link}>Back to Sign In</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ui.bg,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ui.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.ui.textSec,
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.ui.text,
    backgroundColor: colors.ui.card,
    marginBottom: 12,
  },
  error: {
    color: colors.semantic.negative,
    fontSize: 13,
    marginBottom: 12,
  },
  successMsg: {
    fontSize: 15,
    color: colors.semantic.positive,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.brand.teal,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  buttonText: {
    color: colors.ui.card,
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: colors.brand.teal,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});
