import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../core/theme/colors';
import { useAuthStore } from '../../stores/authStore';
import { validateEmail, validatePassword, validatePasswordMatch } from '../../utils/validation';

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { signUp, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    setError(null);
    const emailError = validateEmail(email);
    if (emailError) { setError(emailError); return; }
    const passwordError = validatePassword(password);
    if (passwordError) { setError(passwordError); return; }
    const matchError = validatePasswordMatch(password, confirm);
    if (matchError) { setError(matchError); return; }

    const { error: apiError } = await signUp(email, password);
    if (apiError) { setError(apiError); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <View style={styles.screen}>
        <View style={styles.container}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.successMsg}>Check your email for a confirmation link</Text>
          <Pressable onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.link}>Back to Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start with $100,000 in virtual cash</Text>

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
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.ui.textSec}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={colors.ui.textSec}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        {error != null && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.button} onPress={handleSignUp} disabled={loading}>
          {loading
            ? <ActivityIndicator color={colors.ui.card} />
            : <Text style={styles.buttonText}>Create Account</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.link}>Already have an account? Sign In</Text>
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
    color: colors.ui.textSec,
    marginBottom: 24,
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
